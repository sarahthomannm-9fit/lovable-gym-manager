import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function WorkflowApprovals() {
  const [tasks, setTasks] = useState<any[]>([]);
  const load = async () => { const { data } = await supabase.from('agent_workflow_tasks').select('id, agent_id, task_key, approval_role, created_at, input').eq('status','waiting_human').order('created_at',{ascending:false}); setTasks(data || []); };
  useEffect(() => { load(); }, []);
  return <PersonaLayout title="Aprovações de workflows" accent="#1B6E6E"><div className="max-w-3xl space-y-3">
    {!tasks.length && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhuma tarefa pendente.</CardContent></Card>}
    {tasks.map(task => <Card key={task.id}><CardContent className="p-4 flex items-center justify-between gap-4"><div><p className="font-medium">{task.agent_id} · {task.task_key}</p><p className="text-xs text-muted-foreground">Aprovação: {task.approval_role || 'responsável'}</p></div><Button size="sm" onClick={async () => { const { error } = await supabase.rpc('approve_agent_workflow_task',{p_task_id:task.id}); if(error) toast.error(error.message); else { toast.success('Tarefa aprovada'); load(); } }}>Aprovar</Button></CardContent></Card>)}
  </div></PersonaLayout>;
}