// FitManager <-> FitPro public API
// Auth: x-api-key header (sha256 hash compared with fitmanager_connections.api_key_hash)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const err = (status: number, code = 'invalid_request') =>
  json({ error: code }, status);

async function sha256Hex(input: string) {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function authenticate(req: Request) {
  const key = req.headers.get('x-api-key');
  if (!key) return null;
  const hash = await sha256Hex(key);
  const { data } = await supabase
    .from('fitmanager_connections')
    .select('id, professor_id, status')
    .eq('api_key_hash', hash)
    .maybeSingle();
  if (!data || data.status !== 'active') return null;
  // touch last_sync_at (best-effort)
  supabase
    .from('fitmanager_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {});
  return data;
}

async function logEvent(connectionId: string, event_type: string, payload: unknown, ids?: { fitpro_student_id?: string; fitpro_professor_id?: string }) {
  await supabase.from('fitmanager_events').insert({
    connection_id: connectionId,
    event_type,
    fitpro_student_id: ids?.fitpro_student_id,
    fitpro_professor_id: ids?.fitpro_professor_id,
    payload: payload ?? {},
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  // Path can come as /v1/health OR /fitmanager-api/v1/health
  const path = url.pathname.replace(/^\/fitmanager-api/, '') || '/';

  try {
    // Public
    if (path === '/v1/health' && req.method === 'GET') {
      return json({ ok: true, service: 'fitmanager-api', time: new Date().toISOString() });
    }

    // All other routes require auth
    const conn = await authenticate(req);
    if (!conn) return err(401, 'unauthorized');

    // POST /v1/fitpro/connect
    if (path === '/v1/fitpro/connect' && req.method === 'POST') {
      const Body = z.object({
        fitpro_professor_id: z.string().min(1).max(128),
        meta: z.record(z.any()).optional(),
      });
      const parsed = Body.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return err(400);
      await logEvent(conn.id, 'connect', parsed.data, { fitpro_professor_id: parsed.data.fitpro_professor_id });
      return json({ ok: true, connection_id: conn.id });
    }

    // POST /v1/fitpro/sync
    if (path === '/v1/fitpro/sync' && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      await logEvent(conn.id, 'sync', body);
      return json({ ok: true, synced_at: new Date().toISOString() });
    }

    // POST /v1/fitpro/student-context
    if (path === '/v1/fitpro/student-context' && req.method === 'POST') {
      const Body = z.object({
        fitpro_student_id: z.string().optional(),
        email: z.string().email().optional(),
      }).refine((d) => d.fitpro_student_id || d.email, { message: 'id or email required' });
      const parsed = Body.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return err(400);

      let query = supabase.from('alunos').select('id, nome, email, telefone, status, lifecycle_status').limit(1);
      if (parsed.data.email) query = query.eq('email', parsed.data.email);
      const { data: aluno } = await query.maybeSingle();
      if (!aluno) return json({ student: null, context: null });

      const [{ data: treinos }, { data: checkins }] = await Promise.all([
        supabase.from('treinos').select('id, descricao, data_inicio, data_fim').eq('aluno_id', aluno.id).order('data_inicio', { ascending: false }).limit(10),
        supabase.from('checkins').select('id, data_checkin, horario_entrada').eq('aluno_id', aluno.id).order('horario_entrada', { ascending: false }).limit(10),
      ]);

      await logEvent(conn.id, 'student_context', parsed.data, { fitpro_student_id: parsed.data.fitpro_student_id });
      return json({ student: aluno, treinos: treinos ?? [], checkins: checkins ?? [] });
    }

    // GET /v1/fitpro/students
    if (path === '/v1/fitpro/students' && req.method === 'GET') {
      const { data } = await supabase
        .from('alunos')
        .select('id, nome, email, telefone, status, lifecycle_status')
        .eq('status', 'ativo')
        .order('nome')
        .limit(500);
      await logEvent(conn.id, 'list_students', { count: data?.length ?? 0 });
      return json({ students: data ?? [] });
    }

    // GET /v1/fitpro/classes
    if (path === '/v1/fitpro/classes' && req.method === 'GET') {
      const { data } = await supabase
        .from('aulas')
        .select('id, nome, data_aula, horario_inicio, horario_fim, capacidade_maxima, inscritos_atual, professor_id, status')
        .gte('data_aula', new Date().toISOString().split('T')[0])
        .order('data_aula')
        .limit(200);
      await logEvent(conn.id, 'list_classes', { count: data?.length ?? 0 });
      return json({ classes: data ?? [] });
    }

    // POST /v1/fitpro/check-in
    if (path === '/v1/fitpro/check-in' && req.method === 'POST') {
      const Body = z.object({
        aluno_id: z.string().uuid().optional(),
        email: z.string().email().optional(),
        fitpro_student_id: z.string().optional(),
      }).refine((d) => d.aluno_id || d.email, { message: 'aluno_id or email required' });
      const parsed = Body.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return err(400);

      let alunoId = parsed.data.aluno_id;
      if (!alunoId && parsed.data.email) {
        const { data: a } = await supabase.from('alunos').select('id').eq('email', parsed.data.email).maybeSingle();
        alunoId = a?.id;
      }
      if (!alunoId) return err(404, 'student_not_found');

      const { data: ck, error: ckErr } = await supabase
        .from('checkins')
        .insert({ aluno_id: alunoId })
        .select()
        .single();
      if (ckErr) return err(500, 'checkin_failed');

      await logEvent(conn.id, 'check_in', { aluno_id: alunoId, checkin_id: ck.id }, { fitpro_student_id: parsed.data.fitpro_student_id });
      return json({ ok: true, checkin: ck });
    }

    // GET /v1/fitpro/student-checkins?aluno_id=...&email=...
    if (path === '/v1/fitpro/student-checkins' && req.method === 'GET') {
      const aluno_id = url.searchParams.get('aluno_id');
      const email = url.searchParams.get('email');
      if (!aluno_id && !email) return err(400);

      let id = aluno_id || undefined;
      if (!id && email) {
        const { data: a } = await supabase.from('alunos').select('id').eq('email', email).maybeSingle();
        id = a?.id;
      }
      if (!id) return json({ checkins: [] });

      const { data } = await supabase
        .from('checkins')
        .select('id, data_checkin, horario_entrada, horario_saida')
        .eq('aluno_id', id)
        .order('horario_entrada', { ascending: false })
        .limit(50);
      await logEvent(conn.id, 'list_student_checkins', { aluno_id: id, count: data?.length ?? 0 });
      return json({ checkins: data ?? [] });
    }

    return err(404, 'not_found');
  } catch (e) {
    console.error('[fitmanager-api] error', e);
    return err(500, 'server_error');
  }
});
