import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin, anonAuthClient } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1).optional(),
});

router.post('/signup', async (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  const { email, password, full_name } = parse.data;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error || !data.user) {
    return res.status(400).json({ error: error?.message ?? 'Signup failed' });
  }

  const { error: profErr } = await supabaseAdmin.from('profiles').insert({
    id: data.user.id,
    email,
    full_name: full_name ?? null,
    role: 'user',
  });
  if (profErr) {
    return res.status(500).json({ error: profErr.message });
  }

  const { data: session, error: sessErr } = await anonAuthClient()
    .auth.signInWithPassword({ email, password });
  if (sessErr || !session.session) {
    return res.status(500).json({ error: sessErr?.message ?? 'Login failed' });
  }

  res.json({
    user: { id: data.user.id, email, full_name, role: 'user' },
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }
  const { email, password } = parse.data;

  const { data, error } = await anonAuthClient().auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session || !data.user) {
    return res.status(401).json({ error: error?.message ?? 'Invalid credentials' });
  }

  let { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile) {
    const metaName =
      (data.user.user_metadata as { full_name?: string } | null)?.full_name ??
      null;
    const { data: created, error: insErr } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email ?? email,
        full_name: metaName,
        role: 'user',
      })
      .select('*')
      .single();
    if (insErr) {
      return res.status(500).json({ error: insErr.message });
    }
    profile = created;
  }

  res.json({
    user: profile,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
