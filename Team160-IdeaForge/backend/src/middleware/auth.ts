import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import type { Profile, Role } from '../types.js';

declare global {
  namespace Express {
    interface Request {
      user?: Profile;
      accessToken?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }
  const token = header.slice('Bearer '.length);

  const { data: userData, error: userErr } =
    await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData.user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  if (profErr || !profile) {
    return res.status(401).json({ error: 'Profile not found' });
  }

  req.user = profile as Profile;
  req.accessToken = token;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
