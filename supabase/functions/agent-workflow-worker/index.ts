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
      .select('id, run_id, agent_id, task_key, sequence, status, requires_approval, approval_role, input')
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
      const output = { accepted: true, agent_id: task.agent_id, task_key: task.task_key, processed_at: new Date().toISOString() };
      await db.from('agent_workflow_tasks').update({ status: 'completed', output, completed_at: new Date().toISOString() }).eq('id', task.id);
      results.push({ id: task.id, status: 'completed' });
    }
    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
