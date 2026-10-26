import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(supabaseUrl, serviceKey);
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: cors });
    }
    const { data: auth, error: authError } = await db.auth.getUser(authorization.slice(7));
    if (authError || !auth.user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), { status: 401, headers: cors });
    }
    const { data: role, error: roleError } = await db.from('user_roles')
      .select('role').eq('user_id', auth.user.id).eq('role', 'admin').maybeSingle();
    if (roleError || !role) {
      return new Response(JSON.stringify({ error: 'Acesso restrito a administrador' }), { status: 403, headers: cors });
    }
    const userDb = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {global:{headers:{Authorization:authorization}}});
    const body = await req.json().catch(() => ({}));
    if (!body.organizationId || !/^[0-9a-f-]{36}$/i.test(body.organizationId)) return new Response(JSON.stringify({error:'Condomínio obrigatório'}), {status:400,headers:cors});
    const limit = Math.max(1, Math.min(Number(body.limit) || 20, 100));
    const { data: tasks, error } = await db.from('agent_workflow_tasks')
      .select('id, run_id, agent_id, task_key, sequence, status, requires_approval, approval_role, input, agent_workflow_runs(organization_id)')
      .eq('organization_id', body.organizationId).eq('status', 'queued').order('sequence').limit(limit);
    if (error) throw error;
    const results = [];
    for (const task of tasks || []) {
      if (task.requires_approval) {
        await db.from('agent_workflow_tasks').update({ status: 'waiting_human' }).eq('id', task.id);
        results.push({ id: task.id, status: 'waiting_human' });
        continue;
      }
      const { error: claimError } = await db.rpc('claim_agent_workflow_task', { p_task_id: task.id });
      if (claimError) { results.push({ id: task.id, status: 'skipped' }); continue; }
      const startedAt = Date.now();
      try {
      const supported = ['ativacao', 'seguranca', 'protocolo', 'adaptacao'].includes(task.agent_id);
      if (!supported) {
        const output = { accepted: false, reason: 'handler_not_registered', agent_id: task.agent_id, task_key: task.task_key };
        await db.from('agent_workflow_tasks').update({ status: 'waiting_human', output }).eq('id', task.id);
        results.push({ id: task.id, status: 'waiting_human' });
        continue;
      }
      let output: Record<string, unknown>;
      if (task.agent_id === 'ativacao') {
        const run = Array.isArray(task.agent_workflow_runs) ? task.agent_workflow_runs[0] : task.agent_workflow_runs;
        const orgId = run?.organization_id;
        if (!orgId) throw new Error('workflow sem organization_id');
        const { data: metrics, error: metricsError } = await userDb.rpc('organization_activation_metrics', { p_organization_id: orgId });
        if (metricsError) throw metricsError;
        const m = metrics || {};
        const recommendations = [];
        if (Number(m.moradores_ativos || 0) === 0) recommendations.push('compartilhar QR e convites');
        if (Number(m.checkins_30_dias || 0) === 0) recommendations.push('publicar comunicado de ativação');
        if (Number(m.eventos_publicados || 0) === 0) recommendations.push('agendar Health Day');
        output = { accepted: true, dispatched: true, agent_id: task.agent_id, task_key: task.task_key, organization_id: orgId, metrics: m, recommendations, processed_at: new Date().toISOString() };
      } else if (task.agent_id === 'adaptacao') {
        const input = (task.input || {}) as Record<string, unknown>;
        const feedback = String(input.feedback || '').toLowerCase();
        const pain = /dor|les[aã]o|desconforto|inc[oô]modo/.test(feedback);
        const difficult = /dif[ií]cil|pesado|n[aã]o consegui|cansad/.test(feedback);
        const easy = /f[aá]cil|leve|sobrou|tranquilo/.test(feedback);
        const suggestion = pain ? 'bloquear exercício relacionado e encaminhar para professor' : difficult ? 'reduzir volume ou carga na próxima sessão' : easy ? 'progredir volume ou complexidade gradualmente' : 'manter protocolo e observar próxima execução';
        output = { accepted: true, dispatched: true, agent_id: task.agent_id, task_key: task.task_key, feedback_summary: { pain, difficult, easy }, suggestion, requires_professor_review: pain, processed_at: new Date().toISOString() };
      } else if (task.agent_id === 'protocolo') {
        const input = (task.input || {}) as Record<string, unknown>;
        const restrictions = Array.isArray(input.restrictions) ? input.restrictions.map(String) : [];
        const objective = String(input.objective || 'geral');
        const { data: exercises, error: exerciseError } = await userDb.rpc('eligible_exercises', { p_restrictions: restrictions });
        if (exerciseError) throw exerciseError;
        const pool = (exercises || []).filter((exercise: Record<string, unknown>) => !input.equipment || String(input.equipment).toLowerCase().includes(String(exercise.equipamento || '').toLowerCase()));
        output = { accepted: true, dispatched: true, agent_id: task.agent_id, task_key: task.task_key, objective, restrictions, eligible_exercises: pool.slice(0, 12), eligible_count: pool.length, requires_professor_review: restrictions.length > 0, processed_at: new Date().toISOString() };
      } else if (task.agent_id === 'seguranca') {
        const input = (task.input || {}) as Record<string, unknown>;
        const restrictions = Array.isArray(input.restrictions) ? input.restrictions.map(String) : [];
        const redFlags = ['dor forte', 'cirurgia recente', 'lesão aguda', 'tontura', 'dor no peito', 'falta de ar'];
        const normalized = restrictions.join(' ').toLowerCase();
        const highRisk = redFlags.some(flag => normalized.includes(flag));
        output = { accepted: true, dispatched: true, agent_id: task.agent_id, task_key: task.task_key, risk: highRisk ? 'high' : restrictions.length ? 'moderate' : 'low', blocked: highRisk, requires_professor_review: highRisk || restrictions.length > 0, matched_flags: redFlags.filter(flag => normalized.includes(flag)), processed_at: new Date().toISOString() };
      } else {
        output = { accepted: true, dispatched: true, agent_id: task.agent_id, task_key: task.task_key, processed_at: new Date().toISOString() };
      }
      await db.from('agent_workflow_tasks').update({ status: 'completed', output, completed_at: new Date().toISOString(), duration_ms: Date.now() - startedAt }).eq('id', task.id);
      results.push({ id: task.id, status: 'completed' });
      } catch (taskError) {
        await db.from('agent_workflow_tasks').update({status:'failed',last_error:String(taskError)}).eq('id',task.id);
        results.push({id:task.id,status:'failed',last_error:String(taskError)});
      }
    }
    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
