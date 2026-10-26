import { operationId,completeOperation } from '@/lib/operations';
import { useCallback, useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAlunoVinculo } from '@/hooks/useAlunoVinculo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { COMMON_AREAS, RESIDENT_SERVICES, catalogSelection } from '@/lib/operationalCatalog';

const areas = COMMON_AREAS;
const services = RESIDENT_SERVICES;
export default function MoradorOperacao() {
  const { aluno, loading: linking } = useAlunoVinculo();
  const [area,setArea] = useState('quadra'),[title,setTitle] = useState(''),[start,setStart] = useState(''),[end,setEnd] = useState('');
  const [service,setService] = useState('personal'),[notes,setNotes] = useState(''),[preferred,setPreferred] = useState('');
  const [requests,setRequests] = useState<any[]>([]),[reservations,setReservations] = useState<any[]>([]);
  const [busy,setBusy] = useState(false),[loading,setLoading] = useState(false),[error,setError] = useState('');
  const [catalog,setCatalog] = useState({areas:[] as string[],services:[] as string[]});
  const load = useCallback(async () => {
    setRequests([]);setReservations([]);setError('');setCatalog({areas:[],services:[]});
    if (!aluno?.organization_id) return;
    setLoading(true);
    try {
      const db = supabase as any;
      const [r,s,o] = await Promise.all([
        db.from('area_reservations').select('*').eq('aluno_id',aluno.id).eq('organization_id',aluno.organization_id).order('starts_at',{ascending:false}),
        db.from('service_requests').select('*').eq('aluno_id',aluno.id).eq('organization_id',aluno.organization_id).order('created_at',{ascending:false}),
        db.from('organizations').select('metadata').eq('id',aluno.organization_id).single(),
      ]);
      if (r.error || s.error || o.error) throw r.error || s.error || o.error;
      const enabled={areas:catalogSelection(o.data?.metadata?.operational_catalog?.areas,areas),services:catalogSelection(o.data?.metadata?.operational_catalog?.services,services)};
      setCatalog(enabled);setArea(current=>enabled.areas.includes(current)?current:enabled.areas[0]||'');setService(current=>enabled.services.includes(current)?current:enabled.services[0]||'');
      setReservations(r.data || []);setRequests(s.data || []);
    } catch { setError('Não foi possível consultar reservas e solicitações.'); }
    finally { setLoading(false); }
  },[aluno?.id,aluno?.organization_id]);
  useEffect(() => { void load(); },[load]);
  const perform = async (name:string,payload:Record<string,unknown>,success:string) => {
    if (busy) return false;
    setBusy(true);
    try {
      const {data,error} = await (supabase as any).rpc(name,payload);
      if (error) throw error;
      if(name==='reserve_common_area'&&data?.status!=='confirmada')toast.info('Esta reserva já consta no histórico com status '+data.status);else toast.success(success);await load();return true;
    } catch(e) { toast.error((e as Error).message || 'Não foi possível concluir.');return false; }
    finally { setBusy(false); }
  };
  const reserve = async () => {
    if (!aluno?.organization_id) return;
    if (!catalog.areas.includes(area)) return toast.error('Esta área não está disponível no seu condomínio.');
    const a=new Date(start),b=new Date(end);
    if (!title.trim() || !start || !end || !Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()) || a<=new Date() || b<=a) return toast.error('Informe atividade e horário futuro com fim após o início.');
    const payload={p_organization_id:aluno.organization_id,p_area_type:area,p_title:title.trim(),p_starts_at:a.toISOString(),p_ends_at:b.toISOString()};
    try{const op=await operationId('area',aluno.id,payload);
    if(await perform('reserve_common_area',{...payload,p_request:op.id},'Reserva confirmada.')){completeOperation(op.key);setTitle('');setStart('');setEnd('');}}
    catch{toast.error('Não foi possível preparar a reserva. Confira o armazenamento do navegador.');}
  };
  const request = async () => {
    if (!aluno?.organization_id) return;
    if (!catalog.services.includes(service)) return toast.error('Este serviço não está disponível no seu condomínio.');
    if (preferred && new Date(preferred)<=new Date()) return toast.error('Escolha uma preferência futura.');
    if(preferred&&!Number.isFinite(new Date(preferred).getTime()))return toast.error('Informe uma data válida.');
    const payload={p_organization_id:aluno.organization_id,p_service_type:service,p_preferred_at:preferred?new Date(preferred).toISOString():null,p_notes:notes.trim()};
    try{const op=await operationId('service',aluno.id,payload);
    if(await perform('submit_service_request',{...payload,p_request:op.id},'Solicitação enviada.')){completeOperation(op.key);setNotes('');setPreferred('');}}
    catch{toast.error('Não foi possível preparar a solicitação. Confira o armazenamento do navegador.');}
  };
  return <PersonaLayout title="Reservas e serviços">{linking?<p role="status">Carregando cadastro…</p>:!aluno?.organization_id?<p>Selecione seu condomínio e confirme o vínculo com a administração.</p>:<div className="grid gap-6 md:grid-cols-2">
    <Card><CardHeader><CardTitle>Reservar área</CardTitle></CardHeader><CardContent>{!loading&&!catalog.areas.length&&<p className="mb-3 text-sm">Nenhuma área liberada para reserva pela administração.</p>}<fieldset disabled={busy||loading||!catalog.areas.length} className="space-y-3">
      <Select value={area} onValueChange={setArea}><SelectTrigger aria-label="Área"><SelectValue/></SelectTrigger><SelectContent>{catalog.areas.map(id=><SelectItem key={id} value={id}>{areas[id]}</SelectItem>)}</SelectContent></Select>
      <label className="block text-sm">Atividade<Input value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <label className="block text-sm">Início<Input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></label>
      <label className="block text-sm">Fim<Input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)}/></label>
      <Button onClick={reserve}>Confirmar reserva</Button>
    </fieldset></CardContent></Card>
    <Card><CardHeader><CardTitle>Solicitar serviço</CardTitle></CardHeader><CardContent><p className="mb-3 text-sm text-muted-foreground">O atendimento depende de proposta e da sua confirmação. Enviar a solicitação não confirma horário nem profissional.</p>{!loading&&!catalog.services.length&&<p className="mb-3 text-sm">Nenhum serviço disponibilizado pela administração.</p>}<fieldset disabled={busy||loading||!catalog.services.length} className="space-y-3">
      <Select value={service} onValueChange={setService}><SelectTrigger aria-label="Serviço"><SelectValue/></SelectTrigger><SelectContent>{catalog.services.map(id=><SelectItem key={id} value={id}>{services[id]}</SelectItem>)}</SelectContent></Select>
      <label className="block text-sm">Data e horário preferidos (opcional)<Input type="datetime-local" value={preferred} onChange={e=>setPreferred(e.target.value)}/></label>
      <label className="block text-sm">Observações<Textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label>
      <Button onClick={request}>Enviar solicitação</Button>
    </fieldset></CardContent></Card>
    <div className="md:col-span-2">{loading?<p role="status">Carregando histórico…</p>:error?<div role="alert">{error}<Button onClick={load}>Tentar novamente</Button></div>:<div className="grid gap-6 md:grid-cols-2">
      <Card><CardHeader><CardTitle>Minhas reservas</CardTitle></CardHeader><CardContent className="space-y-3">{!reservations.length&&<p>Nenhuma reserva registrada.</p>}{reservations.map(row=><div key={row.id} className="rounded border p-3 text-sm space-y-2"><p>{row.title} · {areas[row.area_type]}</p><p>{new Date(row.starts_at).toLocaleString('pt-BR')} até {new Date(row.ends_at).toLocaleString('pt-BR')} · {row.status}</p>{row.status==='confirmada'&&new Date(row.starts_at)>new Date()&&<Button variant="outline" disabled={busy} onClick={()=>{if(confirm('Cancelar esta reserva?'))void perform('cancel_area_reservation',{p_id:row.id},'Reserva cancelada.');}}>Cancelar reserva</Button>}</div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Minhas solicitações</CardTitle></CardHeader><CardContent className="space-y-3">{!requests.length&&<p>Nenhuma solicitação registrada.</p>}{requests.map(row=><div key={row.id} className="rounded border p-3 text-sm space-y-2"><p>{services[row.service_type]} · {row.status}</p>{row.assigned_to&&<p>Responsável: {row.assigned_to}</p>}{row.preferred_at&&<p>{new Date(row.preferred_at).toLocaleString('pt-BR')}</p>}{row.quoted_value!=null&&<p>{Number(row.quoted_value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>}<div className="flex gap-2 flex-wrap">{row.status==='cotada'&&<Button disabled={busy} onClick={()=>{if(confirm('Aceitar a proposta e confirmar o serviço pelo valor informado?'))void perform('transition_service_request',{p_id:row.id,p_action:'accept'},'Proposta aceita.');}}>Aceitar proposta</Button>}{['solicitada','cotada','confirmada'].includes(row.status)&&<Button variant="outline" disabled={busy} onClick={()=>{if(confirm('Cancelar esta solicitação?'))void perform('transition_service_request',{p_id:row.id,p_action:'cancel'},'Solicitação cancelada.');}}>Cancelar</Button>}</div></div>)}</CardContent></Card>
    </div>}</div>
  </div>}</PersonaLayout>;
}
