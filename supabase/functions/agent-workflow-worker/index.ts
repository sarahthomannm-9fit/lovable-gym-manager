import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(supabaseUrl, serviceKey);
  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 20), 100);
    const { data: tasks, error } = await db.from('agent_workflow_tasks')
      .select('id, run_id, agent_id, task_key, sequence, status, requires_approval, approval_role, input, agent_workflow_runs(organization_id)')
      .eq('status', 'queued').order('sequence').limit(limit);
    if (error) throw error;
    const results = [];
    for (const task of tasks || []) {
      if (task.requires_approval) {
        await db.from('agent_workflow_tasks').update({ status: 'waiting_human' }).eq('id', task.id);
        results.push({ id: task.id, status: 'waiting_human' });
        continue;
      }
      await db.from('agent_workflow_tasks').update({ status: 'running' }).eq('id', task.id);
      const supported = ['implantacao', 'ativacao', 'seguranca', 'protocolo', 'adaptacao', 'health_day', 'monitoramento', 'retencao'].includes(task.agent_id);
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
        const { data: metrics, error: metricsError } = await db.rpc('organization_activation_metrics', { p_organization_id: orgId });
        if (metricsError) throw metricsError;
        const m = metrics || {};
        const recommendations = [];
        if (Number(m.moradores_ativos || 0) === 0) recommendations.push('compartilhar QR e convites');
        if (Number(m.checkins_30_dias || 0) === 0) recommendations.push('publicar comunicado de ativação');
        if (Number(m.eventos_publicados || 0) === 0) recommendations.push('agendar Health Day');
        output = { accepted: true, dispatched: true, agent_id: task.agent_id, task_key: task.task_key, organization_id: orgId, metrics: m, recommendations, processed_at: new Date().toISOString() };
      } else {
        output = { accepted: true, dispatched: true, agent_id: task.agent_id, task_key: task.task_key, processed_at: new Date().toISOString() };
      }
      await db.from('agent_workflow_tasks').update({ status: 'completed', output, completed_at: new Date().toISOString() }).eq('id', task.id);
      results.push({ id: task.id, status: 'completed' });
    }
    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
