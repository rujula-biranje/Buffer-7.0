import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('items')
    .select('*')
    .order('name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data });
});

const imageUrlSchema = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^https?:\/\//i.test(v) || v.startsWith('/'),
    { message: 'image_url must be an http(s) URL or a site-relative path starting with /' }
  );

const createItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  quantity: z.number().int().nonnegative(),
  prep_time_minutes: z.number().int().positive(),
  is_available: z.boolean().optional(),
  image_url: imageUrlSchema.optional().nullable(),
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const parse = createItemSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  const { data, error } = await supabaseAdmin
    .from('items')
    .insert(parse.data)
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ item: data });
});

const updateItemSchema = createItemSchema.partial();

router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const parse = updateItemSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  const { data, error } = await supabaseAdmin
    .from('items')
    .update({ ...parse.data, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ item: data });
});

const restockSchema = z.object({
  quantity_delta: z.number().int(),
});

router.post(
  '/:id/restock',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const parse = restockSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }
    const { data: item, error: fetchErr } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (fetchErr || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const newQty = Math.max(0, item.quantity + parse.data.quantity_delta);
    const { data, error } = await supabaseAdmin
      .from('items')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ item: data });
  }
);

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { error } = await supabaseAdmin
    .from('items')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
