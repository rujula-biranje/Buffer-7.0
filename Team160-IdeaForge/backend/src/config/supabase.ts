import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error(
    'Missing Supabase env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY'
  );
}

export const supabaseAdmin: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const supabaseAnonUrl = url;
export const supabaseAnonKey = anonKey;

/**
 * Fresh anon client for password sign-in. We must NOT use supabaseAdmin for
 * signInWithPassword, because GoTrueClient stores the resulting user session
 * in-memory on that client and then every subsequent .from(...) call goes out
 * with the user's JWT instead of the service-role key — which trips RLS.
 */
export function anonAuthClient(): SupabaseClient {
  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userClient(accessToken: string): SupabaseClient {
  return createClient(url!, anonKey!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
