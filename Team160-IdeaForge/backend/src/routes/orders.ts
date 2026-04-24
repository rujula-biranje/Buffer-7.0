import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { OrderQueue, computeOrderPrepMinutes } from '../utils/queue.js';
import type { Item, Order, OrderItem, OrderStatus } from '../types.js';

const router = Router();

const cancelWindowSeconds = Number(process.env.CANCEL_WINDOW_SECONDS ?? 60);

async function loadActiveQueue(): Promise<OrderQueue> {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(
      'id, user_id, status, total_price, placed_at, cancellation_deadline, ready_at, delivered_at, cancelled_at, estimated_ready_at, is_vip'
    )
    .in('status', ['pending', 'preparing'])
    .order('placed_at', { ascending: true });
  if (error) throw new Error(error.message);

  const { data: oi, error: oiErr } = await supabaseAdmin
    .from('order_items')
    .select('order_id, item_id, quantity, items(prep_time_minutes)')
    .in(
      'order_id',
      (orders ?? []).map((o) => o.id)
    );
  if (oiErr) throw new Error(oiErr.message);

  const prepMap = new Map<string, number>();
  for (const o of orders ?? []) {
    const rows = (oi ?? []).filter((r) => r.order_id === o.id);
    const mapped = rows.map((r) => ({
      id: '',
      order_id: r.order_id,
      item_id: r.item_id,
      quantity: r.quantity,
      price_at_order: 0,
      item: {
        prep_time_minutes:
          (r.items as unknown as { prep_time_minutes: number })
            ?.prep_time_minutes ?? 10,
      },
    }));
    prepMap.set(o.id, computeOrderPrepMinutes(mapped));
  }

  return new OrderQueue(
    (orders ?? []).map((o) => ({
      order: o as Order,
      prepMinutes: prepMap.get(o.id) ?? 0,
    }))
  );
}

const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        item_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

router.post('/', requireAuth, async (req, res) => {
  const parse = placeOrderSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }

  const itemIds = parse.data.items.map((i) => i.item_id);
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('items')
    .select('*')
    .in('id', itemIds);
  if (itemsErr) return res.status(500).json({ error: itemsErr.message });

  const itemMap = new Map<string, Item>(
    (items ?? []).map((i) => [i.id, i as Item])
  );

  let total = 0;
  for (const line of parse.data.items) {
    const it = itemMap.get(line.item_id);
    if (!it) return res.status(400).json({ error: `Unknown item ${line.item_id}` });
    if (!it.is_available || it.quantity < line.quantity) {
      return res
        .status(409)
        .json({ error: `Item "${it.name}" not available in requested qty` });
    }
    total += Number(it.price) * line.quantity;
  }
  total = Math.round(total * 100) / 100;

  const { data: order, error: ordErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: req.user!.id,
      status: 'pending',
      total_price: total,
      is_vip: req.user!.role === 'vip',
    })
    .select('*')
    .single();
  if (ordErr || !order) {
    return res.status(500).json({ error: ordErr?.message ?? 'Order failed' });
  }

  const orderItemsPayload = parse.data.items.map((line) => {
    const it = itemMap.get(line.item_id)!;
    return {
      order_id: order.id,
      item_id: it.id,
      quantity: line.quantity,
      price_at_order: Number(it.price),
    };
  });
  const { error: oiErr } = await supabaseAdmin
    .from('order_items')
    .insert(orderItemsPayload);
  if (oiErr) return res.status(500).json({ error: oiErr.message });

  for (const line of parse.data.items) {
    const it = itemMap.get(line.item_id)!;
    await supabaseAdmin
      .from('items')
      .update({
        quantity: it.quantity - line.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', it.id);
  }

  const queue = await loadActiveQueue();
  const etaMinutes = queue.etaMinutesFor(order.id) ?? 0;
  const estimatedReadyAt = new Date(
    Date.now() + etaMinutes * 60_000
  ).toISOString();
  await supabaseAdmin
    .from('orders')
    .update({ estimated_ready_at: estimatedReadyAt })
    .eq('id', order.id);

  res.status(201).json({
    order: { ...order, estimated_ready_at: estimatedReadyAt },
    queue_position: queue.positionOf(order.id),
    eta_minutes: etaMinutes,
    cancellation_deadline_seconds: cancelWindowSeconds,
  });
});

router.get('/my', requireAuth, async (req, res) => {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, item:items(*))')
    .eq('user_id', req.user!.id)
    .order('placed_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const queue = await loadActiveQueue();
  const enriched = (orders ?? []).map((o) => ({
    ...o,
    queue_position:
      o.status === 'pending' || o.status === 'preparing'
        ? queue.positionOf(o.id)
        : null,
    eta_minutes:
      o.status === 'pending' || o.status === 'preparing'
        ? queue.etaMinutesFor(o.id)
        : null,
  }));

  res.json({ orders: enriched });
});

router.get(
  '/queue',
  requireAuth,
  requireRole('admin'),
  async (_req, res) => {
    const queue = await loadActiveQueue();
    const ids = queue.toArray().map((e) => e.order.id);
    if (ids.length === 0) return res.json({ queue: [] });

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(
        '*, user:profiles(id,email,full_name,role), order_items(*, item:items(name, prep_time_minutes))'
      )
      .in('id', ids)
      .order('placed_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });

    const withPos = (data ?? []).map((o, i) => ({
      ...o,
      queue_position: i + 1,
      eta_minutes: queue.etaMinutesFor(o.id),
    }));
    res.json({ queue: withPos });
  }
);

router.delete('/:id', requireAuth, async (req, res) => {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !order) return res.status(404).json({ error: 'Not found' });
  if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (order.status !== 'pending') {
    return res.status(409).json({ error: 'Order can no longer be cancelled' });
  }
  const placedMs = new Date(order.placed_at).getTime();
  const elapsedSec = (Date.now() - placedMs) / 1000;
  if (elapsedSec > cancelWindowSeconds && req.user!.role !== 'admin') {
    return res
      .status(409)
      .json({ error: `Cancel window (${cancelWindowSeconds}s) has passed` });
  }

  const { data: oitems } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  for (const oi of (oitems ?? []) as OrderItem[]) {
    const { data: it } = await supabaseAdmin
      .from('items')
      .select('quantity')
      .eq('id', oi.item_id)
      .single();
    if (it) {
      await supabaseAdmin
        .from('items')
        .update({
          quantity: it.quantity + oi.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', oi.item_id);
    }
  }

  const { data: updated, error: updErr } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', order.id)
    .select('*')
    .single();
  if (updErr) return res.status(500).json({ error: updErr.message });

  res.json({ order: updated });
});

const statusSchema = z.object({
  status: z.enum(['preparing', 'ready', 'delivered']),
});

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const parse = statusSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }
    const updates: Partial<Order> = { status: parse.data.status as OrderStatus };
    if (parse.data.status === 'ready') updates.ready_at = new Date().toISOString();
    if (parse.data.status === 'delivered')
      updates.delivered_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ order: data });
  }
);

/** Admin: pop the FIFO head, mark it delivered. Demonstrates the Queue dequeue. */
router.post(
  '/dequeue-next',
  requireAuth,
  requireRole('admin'),
  async (_req, res) => {
    const queue = await loadActiveQueue();
    const head = queue.peek();
    if (!head) return res.json({ order: null });

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', head.order.id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ order: data });
  }
);

export default router;
