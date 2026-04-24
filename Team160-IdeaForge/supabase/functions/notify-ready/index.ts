// Supabase Edge Function (Deno runtime)
// Scans for orders whose estimated_ready_at has passed and flips them to 'ready'.
// Deploy: `supabase functions deploy notify-ready`
// Invoke: schedule a cron via pg_cron or call from the Node backend periodically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// deno-lint-ignore no-explicit-any
const Deno: any = (globalThis as any).Deno;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (_req: Request) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from('orders')
    .select('id, user_id, estimated_ready_at')
    .in('status', ['pending', 'preparing'])
    .lte('estimated_ready_at', now);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const ids = (due ?? []).map((o) => o.id);
  if (ids.length === 0) {
    return new Response(JSON.stringify({ marked_ready: 0 }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const { error: updErr } = await supabase
    .from('orders')
    .update({ status: 'ready', ready_at: now })
    .in('id', ids);

  if (updErr) {
    return new Response(JSON.stringify({ error: updErr.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ marked_ready: ids.length, ids }), {
    headers: { 'content-type': 'application/json' },
  });
});
