import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function SupportTickets({ orgId, alunoId, manage = false }: { orgId: string; alunoId?: string; manage?: boolean }) {
  const { user } = useAuth();
  const [rows,setRows] = useState<any[]>([]);
  const [message,setMessage] = useState('');
  const [category,setCategory]=useState('condominio');
  const [responses,setResponses] = useState<Record<string,string>>({});
  const [loading,setLoading] = useState(false),[busy,setBusy] = useState(false),[error,setError] = useState('');
  const load = useCallback(async () => {
    setRows([]);setError('');
    if (!orgId || !user) return;
    setLoading(true);
    try {
      let query = supabase.from('support_tickets').select('*').eq('organization_id',orgId).order('created_at',{ascending:false});
      if (!manage) query = query.eq('created_by',user.id);
      const {data,error} = await query.limit(100);
      if (error) throw error;
      setRows(data || []);
    } catch { setError('Não foi possível carregar solicitações de suporte.'); }
    finally { setLoading(false); }
  },[orgId,user?.id,manage]);
  useEffect(()=>{void load();},[load]);
  const send = async () => {
    if (!user || !orgId || busy || message.trim().length<3) return;
    setBusy(true);
    try {
      const {error} = await supabase.from('support_tickets').insert({organization_id:orgId,created_by:user.id,aluno_id:alunoId || null,message:message.trim(),category});
      if(error)throw error;
      setMessage('');toast.success('Solicitação enviada.');await load();
    }catch(e){toast.error((e as Error).message || 'Falha ao enviar.');}
    finally{setBusy(false);}
  };
  const respond = async (id:string,resolve:boolean) => {
    if(busy)return;
    setBusy(true);
    try{
      const {error}=await (supabase as any).rpc('resolve_support_ticket',{p_id:id,p_response:responses[id] || '',p_resolve:resolve});
      if(error)throw error;
      toast.success(resolve?'Solicitação resolvida.':'Resposta salva.');await load();
    }catch(e){toast.error((e as Error).message || 'Falha ao responder.');}
    finally{setBusy(false);}
  };
  return <Card><CardHeader><CardTitle>{manage?'Atendimento do condomínio':'Minhas solicitações de suporte'}</CardTitle></CardHeader><CardContent className="space-y-4">
    {!manage&&<div className="space-y-2"><label className="block text-sm">Destino<select className="mt-1 block w-full rounded border bg-background p-2" value={category} onChange={e=>setCategory(e.target.value)}><option value="condominio">Operação do condomínio</option><option value="treino_saude">Treino e saúde (profissional)</option><option value="privacidade">Privacidade e dados pessoais (administração)</option></select></label><label className="block text-sm">Como podemos ajudar?<Textarea maxLength={4000} value={message} onChange={e=>setMessage(e.target.value)}/></label><Button disabled={busy||message.trim().length<3} onClick={send}>Enviar solicitação</Button></div>}
    {loading?<p role="status">Carregando…</p>:error?<div role="alert">{error}<Button onClick={load}>Tentar novamente</Button></div>:!rows.length?<p className="text-sm text-muted-foreground">Nenhuma solicitação registrada.</p>:rows.map(row=><div key={row.id} className="space-y-2 rounded border p-3 text-sm"><p>{row.message}</p><p className="text-muted-foreground">{row.status} · {new Date(row.created_at).toLocaleString('pt-BR')}</p>{row.agent_response&&<p className="rounded bg-muted p-2">Resposta: {row.agent_response}</p>}{manage&&row.status!=='resolved'&&<div className="space-y-2"><Textarea aria-label="Resposta ao solicitante" value={responses[row.id] ?? row.agent_response ?? ''} onChange={e=>setResponses({...responses,[row.id]:e.target.value})}/><div className="flex gap-2"><Button disabled={busy} variant="outline" onClick={()=>respond(row.id,false)}>Responder</Button><Button disabled={busy} onClick={()=>respond(row.id,true)}>Responder e resolver</Button></div></div>}</div>)}
    <Button variant="ghost" disabled={loading||busy} onClick={load}>Atualizar solicitações</Button>
  </CardContent></Card>;
}
