import { useCallback,useEffect,useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
export function ServiceRequestsBoard({orgId}:{orgId:string}) {
  const [rows,setRows]=useState<any[]>([]),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [drafts,setDrafts]=useState<Record<string,{value:string;owner:string;date:string}>>({});
  const load=useCallback(async()=>{
    setRows([]);setError('');if(!orgId)return;setLoading(true);
    try{const {data,error}=await (supabase as any).rpc('operational_service_requests',{p_org_id:orgId});if(error)throw error;setRows(data||[]);}
    catch{setError('Falha ao carregar solicitações.');}finally{setLoading(false);}
  },[orgId]);
  useEffect(()=>{void load();},[load]);
  const action=async(name:string,payload:Record<string,unknown>)=>{
    if(busy)return;setBusy(true);
    try{const {error}=await (supabase as any).rpc(name,payload);if(error)throw error;toast.success('Solicitação atualizada.');await load();}
    catch(e){toast.error((e as Error).message||'Não foi possível concluir.');}finally{setBusy(false);}
  };
  const quote=(row:any)=>{
    const d=drafts[row.id]||{value:row.quoted_value==null?'':String(row.quoted_value),owner:row.assigned_to||'',date:''};const value=Number(d.value);
    if(!d?.value.trim()||!Number.isFinite(value)||value<0||!d.owner.trim())return toast.error('Informe valor e responsável pela execução.');
    if(d.date&&new Date(d.date)<=new Date())return toast.error('Escolha uma data futura.');
    void action('quote_service_request',{p_id:row.id,p_value:value,p_assigned_to:d.owner.trim(),p_preferred_at:d.date?new Date(d.date).toISOString():null});
  };
  return <Card><CardHeader><CardTitle>Solicitações de serviços</CardTitle></CardHeader><CardContent className="space-y-3">
    {loading?<p role="status">Carregando…</p>:error?<div role="alert">{error}<Button onClick={load}>Tentar novamente</Button></div>:!rows.length?<p>Nenhuma solicitação.</p>:rows.map(row=>{
      const d=drafts[row.id]||{value:row.quoted_value==null?'':String(row.quoted_value),owner:row.assigned_to||'',date:''};
      const patch=(value:Partial<typeof d>)=>setDrafts({...drafts,[row.id]:{...d,...value}});
      return <div key={row.id} className="space-y-3 rounded border p-3 text-sm"><p className="font-medium">{row.alunos?.nome||'Morador'} · {row.service_type} · {row.status}</p>{row.notes&&<p>{row.notes}</p>}{row.preferred_at&&<p>Horário: {new Date(row.preferred_at).toLocaleString('pt-BR')}</p>}
        {['solicitada','cotada'].includes(row.status)&&<fieldset disabled={busy} className="grid gap-2 sm:grid-cols-3"><label>Valor da proposta<Input type="number" min="0" step="0.01" value={d.value} onChange={e=>patch({value:e.target.value})}/></label><label>Responsável<Input value={d.owner} onChange={e=>patch({owner:e.target.value})}/></label><label>Horário proposto<Input type="datetime-local" value={d.date} onChange={e=>patch({date:e.target.value})}/></label><Button onClick={()=>{if(!drafts[row.id])setDrafts({...drafts,[row.id]:d});quote({...row});}}>Enviar proposta</Button></fieldset>}
        {row.quoted_value!=null&&<p>Proposta: {Number(row.quoted_value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} · {row.assigned_to}</p>}
        <div className="flex gap-2">{row.status==='confirmada'&&<Button disabled={busy} onClick={()=>{if(confirm('Confirmar que o serviço foi realizado?'))void action('transition_service_request',{p_id:row.id,p_action:'complete'});}}>Concluir atendimento</Button>}{['solicitada','cotada','confirmada'].includes(row.status)&&<Button variant="outline" disabled={busy} onClick={()=>{if(confirm('Cancelar solicitação?'))void action('transition_service_request',{p_id:row.id,p_action:'cancel'});}}>Cancelar solicitação</Button>}</div>
      </div>;
    })}
    <Button variant="ghost" disabled={loading||busy} onClick={load}>Atualizar</Button>
  </CardContent></Card>;
}
