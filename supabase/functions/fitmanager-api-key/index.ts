// Admin-only function to manage FitManager API keys
// Auth: Supabase JWT (admin user)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function sha256Hex(input: string) {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `fm_live_${hex}`;
}

async function getUserFromJwt(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } }
  );
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getUserFromJwt(req);
    if (!user) return json({ error: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const Action = z.object({ action: z.enum(['generate', 'rotate', 'revoke']) });
    const parsed = Action.safeParse(body);
    if (!parsed.success) return json({ error: 'invalid_request' }, 400);

    if (parsed.data.action === 'generate' || parsed.data.action === 'rotate') {
      // revoke existing active for this user
      await admin
        .from('fitmanager_connections')
        .update({ status: 'revoked' })
        .eq('professor_id', user.id)
        .eq('status', 'active');

      const raw = randomKey();
      const hash = await sha256Hex(raw);
      const prefix = raw.slice(0, 16); // fm_live_XXXXXXXX

      const { data, error } = await admin
        .from('fitmanager_connections')
        .insert({
          professor_id: user.id,
          api_key_hash: hash,
          api_key_prefix: prefix,
          status: 'active',
        })
        .select('id, api_key_prefix, status, created_at')
        .single();

      if (error) {
        console.error('insert failed', error);
        return json({ error: 'server_error' }, 500);
      }

      return json({ ok: true, connection: data, api_key: raw });
    }

    if (parsed.data.action === 'revoke') {
      await admin
        .from('fitmanager_connections')
        .update({ status: 'revoked' })
        .eq('professor_id', user.id)
        .eq('status', 'active');
      return json({ ok: true });
    }

    return json({ error: 'invalid_request' }, 400);
  } catch (e) {
    console.error('[fitmanager-api-key] error', e);
    return json({ error: 'server_error' }, 500);
  }
});
