import { useCallback,useEffect,useState } from 'react';
import { PersonaLayout,PersonaEmptyState } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export default function WorkflowApprovals(){
  const {activeOrg,isAdmin}=useOperationalContext();
  const [tasks,setTasks]=useState<any[]>([]),[reasons,setReasons]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [agent,setAgent]=useState(''),[taskKey,setTaskKey]=useState(''),[payload,setPayload]=useState('{}');
  const load=useCallback(async()=>{
    setTasks([]);setError('');if(!activeOrg)return;setLoading(true);
    try{const {data,error}=await (supabase as any).from('agent_workflow_tasks').select('*').eq('organization_id',activeOrg.id).order('created_at',{ascending:false}).limit(100);if(error)throw error;setTasks(data||[]);}
    catch{setError('Não foi possível carregar aprovações.');}finally{setLoading(false);}
  },[activeOrg?.id]);
  useEffect(()=>{void load();},[load]);
  const decide=async(id:string,approve:boolean)=>{
    if(busy)return;setBusy(true);
    try{const {error}=await (supabase as any).rpc('decide_agent_workflow',{p_id:id,p_approve:approve,p_reason:reasons[id]||''});if(error)throw error;toast.success(approve?'Aprovação registrada.':'Rejeição registrada.');await load();}
    catch(e){toast.error((e as Error).message||'Falha ao decidir.');}finally{setBusy(false);}
  };
  const execute=async()=>{
    if(busy)return;setBusy(true);
    try{const {data,error}=await supabase.functions.invoke('agent-workflow-worker',{body:{limit:20,organizationId:activeOrg?.id}});if(error||data?.error)throw error||new Error(data.error);toast.success('Processamento concluído. Confira o status e a saída de cada tarefa.');await load();}catch(e){toast.error((e as Error).message||'Falha ao executar.');}finally{setBusy(false);}
  };
  const create=async()=>{
    if(!activeOrg||busy)return;
    let input:unknown;
    try{input=JSON.parse(payload);if(!input||typeof input!=='object'||Array.isArray(input))throw new Error();}catch{return toast.error('Informe um objeto JSON válido.');}
    if(!agent.trim()||!taskKey.trim())return toast.error('Informe agente e tarefa.');
    setBusy(true);
    try{const {error}=await (supabase as any).from('agent_workflow_tasks').insert({organization_id:activeOrg.id,agent_id:agent.trim(),task_key:taskKey.trim(),input});if(error)throw error;toast.success('Solicitação de aprovação criada.');setAgent('');setTaskKey('');setPayload('{}');await load();}
    catch(e){toast.error((e as Error).message||'Falha ao criar.');}finally{setBusy(false);}
  };
  return <PersonaLayout title="Aprovações de workflows">{!activeOrg?<PersonaEmptyState/>:<div className="space-y-4">
    {isAdmin&&<Card><CardHeader><CardTitle>Nova solicitação de aprovação</CardTitle></CardHeader><CardContent><fieldset disabled={busy} className="space-y-3"><label className="block text-sm">Agente<Input value={agent} onChange={e=>setAgent(e.target.value)}/></label><label className="block text-sm">Tarefa<Input value={taskKey} onChange={e=>setTaskKey(e.target.value)}/></label><label className="block text-sm">Dados da solicitação (JSON)<Textarea value={payload} onChange={e=>setPayload(e.target.value)}/></label><Button onClick={create}>Registrar para aprovação</Button></fieldset></CardContent></Card>}
    {loading?<p role="status">Carregando…</p>:error?<div role="alert">{error}<Button onClick={load}>Tentar novamente</Button></div>:!tasks.length?<p>Nenhuma tarefa registrada.</p>:tasks.map(task=><Card key={task.id}><CardContent className="p-4 space-y-3"><p className="font-medium">{task.agent_id} · {task.task_key} · {task.status}</p><details><summary className="cursor-pointer text-sm">Ver dados da solicitação</summary><pre className="mt-2 max-h-64 overflow-auto text-xs">{JSON.stringify({entrada:task.input,saida:task.output,erro:task.last_error},null,2)}</pre></details>{task.status==='waiting_human'?<div className="space-y-2"><Textarea aria-label="Motivo da decisão" placeholder="Motivo (obrigatório para rejeitar)" value={reasons[task.id]||''} onChange={e=>setReasons({...reasons,[task.id]:e.target.value})}/><div className="flex gap-2"><Button disabled={busy} onClick={()=>decide(task.id,true)}>Aprovar</Button><Button variant="outline" disabled={busy} onClick={()=>decide(task.id,false)}>Rejeitar</Button></div></div>:<p className="text-sm text-muted-foreground">{task.decision_reason || 'Decisão registrada'} · {task.decided_at?new Date(task.decided_at).toLocaleString('pt-BR'):''}</p>}</CardContent></Card>)}
    <Button variant="outline" disabled={loading||busy} onClick={load}>Atualizar</Button>{isAdmin&&<Button disabled={loading||busy||!tasks.some(t=>t.status==='queued')} onClick={execute}>Executar tarefas aprovadas</Button>}
  </div>}</PersonaLayout>;
}
