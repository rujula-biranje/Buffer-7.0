import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/users', requireAuth, requireRole('admin'), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

const createVipSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional(),
});

router.post(
  '/users/vip',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const parse = createVipSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: parse.data.email,
      password: parse.data.password,
      email_confirm: true,
      user_metadata: { full_name: parse.data.full_name, role: 'vip' },
    });
    if (error || !data.user) {
      return res
        .status(400)
        .json({ error: error?.message ?? 'VIP creation failed' });
    }

    const { error: profErr } = await supabaseAdmin.from('profiles').insert({
      id: data.user.id,
      email: parse.data.email,
      full_name: parse.data.full_name ?? null,
      role: 'vip',
    });
    if (profErr) return res.status(500).json({ error: profErr.message });

    res.status(201).json({
      user: {
        id: data.user.id,
        email: parse.data.email,
        full_name: parse.data.full_name,
        role: 'vip',
      },
    });
  }
);

const setRoleSchema = z.object({
  role: z.enum(['user', 'vip', 'admin']),
});

router.patch(
  '/users/:id/role',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const parse = setRoleSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role: parse.data.role })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ user: data });
  }
);

export default router;
