import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('polls')
    .select(
      '*, item:items(id,name,is_available,quantity), options:poll_options(*), votes:poll_votes(option_id,user_id)'
    )
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const enriched = (data ?? []).map((p) => {
    const tally = new Map<string, number>();
    for (const v of p.votes ?? []) {
      tally.set(v.option_id, (tally.get(v.option_id) ?? 0) + 1);
    }
    const options = (p.options ?? []).map((o: { id: string; label: string }) => ({
      ...o,
      votes: tally.get(o.id) ?? 0,
    }));
    return { ...p, options, votes: undefined };
  });
  res.json({ polls: enriched });
});

const createPollSchema = z.object({
  question: z.string().min(1),
  item_id: z.string().uuid().optional(),
  options: z.array(z.string().min(1)).min(2),
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const parse = createPollSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }

  if (parse.data.item_id) {
    const { data: item } = await supabaseAdmin
      .from('items')
      .select('id')
      .eq('id', parse.data.item_id)
      .single();
    if (!item)
      return res.status(400).json({ error: 'Referenced item not found' });
  }

  const { data: poll, error } = await supabaseAdmin
    .from('polls')
    .insert({
      question: parse.data.question,
      item_id: parse.data.item_id ?? null,
      created_by: req.user!.id,
      status: 'open',
    })
    .select('*')
    .single();
  if (error || !poll) {
    return res.status(500).json({ error: error?.message ?? 'Poll failed' });
  }

  const optionsPayload = parse.data.options.map((label) => ({
    poll_id: poll.id,
    label,
  }));
  const { data: options, error: optErr } = await supabaseAdmin
    .from('poll_options')
    .insert(optionsPayload)
    .select('*');
  if (optErr) return res.status(500).json({ error: optErr.message });

  res.status(201).json({ poll: { ...poll, options } });
});

const voteSchema = z.object({
  option_id: z.string().uuid(),
});

router.post('/:id/vote', requireAuth, async (req, res) => {
  const parse = voteSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  const { data: poll } = await supabaseAdmin
    .from('polls')
    .select('id,status')
    .eq('id', req.params.id)
    .single();
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.status !== 'open')
    return res.status(409).json({ error: 'Poll is closed' });

  const { error } = await supabaseAdmin
    .from('poll_votes')
    .upsert(
      {
        poll_id: req.params.id,
        option_id: parse.data.option_id,
        user_id: req.user!.id,
      },
      { onConflict: 'poll_id,user_id' }
    );
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.post(
  '/:id/close',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('polls')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ poll: data });
  }
);

export default router;
