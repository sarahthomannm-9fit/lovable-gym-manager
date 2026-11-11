import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { decideTriage } from '../_shared/triagem.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Cache-Control': 'no-store',
};
const reply = (status: number) => new Response(null, { status, headers: cors });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return reply(204);
  if (request.method !== 'POST') return reply(405);
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!key || !authorization?.startsWith('Bearer ')) return reply(403);
  const body = await request.json().catch(() => null);
  const id = body?.anamnese_id;
  if (typeof id !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
    return reply(400);
  }
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, key);
    if (authorization !== `Bearer ${key}`) {
      const { data: { user }, error: authError } = await db.auth.getUser(authorization.slice(7));
      if (authError || !user) return reply(403);
      const { data: form, error } = await db.from('anamnese_respostas')
        .select('id,alunos!inner(user_id)').eq('id', id).eq('alunos.user_id', user.id).maybeSingle();
      if (error) throw error;
      if (!form) return reply(404);
    }
    return reply(await decideTriage(db, id, Deno.env.get('LOVABLE_API_KEY')) ? 204 : 404);
  } catch {
    return reply(503);
  }
});
