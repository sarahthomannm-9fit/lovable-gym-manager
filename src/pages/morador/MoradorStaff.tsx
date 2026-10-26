import { useCallback,useEffect,useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { useAlunoVinculo } from '@/hooks/useAlunoVinculo';
import { supabase } from '@/integrations/supabase/client';
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
const base=import.meta.env.VITE_STAFF_API_URL||'https://xtexysqtfsofdohujtfr.supabase.co/functions/v1/staff-api';
type Method={id:string;name:string};
type Pro={id:string;name:string;role:string;location:string;availability:string[];match_score?:number};
export default function MoradorStaff(){
 const {aluno,loading:linking}=useAlunoVinculo();
 const [methods,setMethods]=useState<Method[]>([]),[pros,setPros]=useState<Pro[]>([]),[requests,setRequests]=useState<any[]>([]),[bookings,setBookings]=useState<any[]>([]);
 const [method,setMethod]=useState<Method|null>(null),[pro,setPro]=useState<Pro|null>(null),[slot,setSlot]=useState(''),[requestId,setRequestId]=useState(()=>crypto.randomUUID());
 const [credits,setCredits]=useState(0),[configured,setConfigured]=useState(false),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{
  if(!aluno)return;setLoading(true);setError('');
  try{
   if(import.meta.env.VITE_APP_ENV==='staging'&&(!import.meta.env.VITE_STAFF_API_URL||base.includes('xtexysqtfsofdohujtfr')))throw new Error('Configure o catálogo Staff de staging antes de ativar a integração.');
   const [catalog,student,history,mirrors,configuration]=await Promise.all([
    fetch(base+'/methods').then(async r=>{if(!r.ok)throw new Error('Catálogo indisponível');return r.json();}),
    supabase.from('alunos').select('aulas_disponiveis').eq('id',aluno.id).single(),
    (supabase as any).from('professional_booking_requests').select('*').eq('aluno_id',aluno.id).order('created_at',{ascending:false}),
    supabase.from('staff_bookings').select('*').eq('aluno_id',aluno.id).order('created_at',{ascending:false}),
    supabase.functions.invoke('staff-booking',{body:{action:'status'}}),
   ]);
   if(student.error||history.error||mirrors.error)throw student.error||history.error||mirrors.error;
   setMethods((catalog.methods||[]).map((m:any)=>({id:m.id,name:m.name||m.nome})));
   setCredits(student.data?.aulas_disponiveis||0);setRequests(history.data||[]);setBookings(mirrors.data||[]);setConfigured(configuration.data?.configured===true);
  }catch(e){setError((e as Error).message||'Falha ao carregar agendamentos.');}finally{setLoading(false);}
 },[aluno?.id]);
 useEffect(()=>{setMethod(null);setPro(null);setRequests([]);setBookings([]);void load();},[load]);
 const choose=async(m:Method)=>{
  setMethod(m);setPro(null);setLoading(true);setError('');
  try{const response=await fetch(base+'/match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method:m.id,limit:20})});if(!response.ok)throw new Error('Falha ao buscar profissionais');const data=await response.json();setPros(data.matches||data.professionals||[]);}
  catch(e){setError((e as Error).message);setPros([]);}finally{setLoading(false);}
 };
 const invoke=async(body:Record<string,unknown>)=>{
  const {data,error}=await supabase.functions.invoke('staff-booking',{body});
  if(error){let message=error.message;try{const payload=await (error as any).context?.json();message=payload?.error||message;}catch{/* preserve message */}throw new Error(message);}
  if(data?.error)throw new Error(data.error);
  return data;
 };
 const book=async()=>{
  if(!aluno||!method||!pro||busy)return;
  if(!slot||new Date(slot)<=new Date())return toast.error('Escolha uma data futura.');
  setBusy(true);
  try{
   const result=await invoke({action:'create',request_id:requestId,aluno_id:aluno.id,freelancer_id:pro.id,method:method.id,professional_name:pro.name,hub:pro.location||'',slot:new Date(slot).toISOString()});
   toast.success(result.message||'Reserva enviada. Aguarde confirmação do profissional.');
   setPro(null);setSlot('');setRequestId(crypto.randomUUID());await load();
  }catch(e){toast.error((e as Error).message);await load();}
  finally{setBusy(false);}
 };
 const refresh=async()=>{
  if(!aluno||busy)return;setBusy(true);
  try{await invoke({action:'refresh',aluno_id:aluno.id});await load();toast.success('Histórico atualizado.');}
  catch(e){toast.error((e as Error).message);}finally{setBusy(false);}
 };
 const cancel=async(id:string)=>{
  if(busy||!confirm('Solicitar cancelamento ao atendimento? O crédito será devolvido após a confirmação da Staff.'))return;
  setBusy(true);
  try{const {error}=await (supabase as any).rpc('request_professional_cancellation',{p_id:id});if(error)throw error;toast.success('Cancelamento encaminhado ao atendimento.');await load();}
  catch(e){toast.error((e as Error).message);}finally{setBusy(false);}
 };
 return <PersonaLayout title="Agendar profissional">{linking?<p role="status">Carregando cadastro…</p>:!aluno?<p>Confirme seu vínculo de morador com a administração.</p>:<div className="space-y-5">
  <p>Créditos disponíveis: <strong>{credits}</strong></p>
  {!configured&&!loading&&<p className="rounded border border-amber-500 p-3 text-sm">A conexão de reservas Staff ainda precisa ser configurada pela administração. O catálogo está disponível; nenhuma reserva ou cobrança será feita enquanto a conexão estiver indisponível.</p>}
  {error&&<div role="alert">{error}<Button variant="outline" onClick={load}>Tentar novamente</Button></div>}
  {loading&&<p role="status">Carregando…</p>}
  {!method?<Card><CardHeader><CardTitle>Escolha o método</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{methods.map(m=><Button variant="outline" disabled={busy||loading} key={m.id} onClick={()=>choose(m)}>{m.name}</Button>)}{!loading&&!methods.length&&<p>Nenhum método disponível.</p>}</CardContent></Card>:!pro?<Card><CardHeader><CardTitle>Profissionais · {method.name}</CardTitle></CardHeader><CardContent className="space-y-3">{!loading&&!pros.length&&<p>Nenhum profissional disponível para este método.</p>}{pros.map(p=><div key={p.id} className="rounded border p-4 space-y-2"><p className="font-medium">{p.name}</p><p className="text-sm">{p.role} · {p.location}</p><p className="text-sm text-muted-foreground">Disponibilidade informada: {(p.availability||[]).join(', ')||'A confirmar'}</p><Button disabled={busy||loading} onClick={()=>{setPro(p);setSlot('');setRequestId(crypto.randomUUID());}}>Escolher profissional</Button></div>)}<Button variant="ghost" onClick={()=>setMethod(null)}>Voltar aos métodos</Button></CardContent></Card>:<Card><CardHeader><CardTitle>Confirmar solicitação</CardTitle></CardHeader><CardContent className="space-y-3"><p>{method.name} · {pro.name}</p><p>Custo: 1 crédito. A confirmação depende do profissional.</p><label className="block text-sm">Data e horário desejados<Input type="datetime-local" value={slot} onChange={e=>setSlot(e.target.value)} disabled={busy}/></label><div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={()=>setPro(null)}>Voltar</Button><Button disabled={busy||!configured||credits<1||!slot} onClick={book}>{busy?'Enviando…':'Confirmar reserva'}</Button></div></CardContent></Card>}
  <Card><CardHeader><CardTitle>Meus agendamentos</CardTitle></CardHeader><CardContent className="space-y-3"><Button variant="outline" disabled={busy||loading} onClick={refresh}>Consultar confirmação Staff</Button>{!requests.length&&!bookings.length&&<p>Nenhum agendamento registrado.</p>}{requests.map(r=>{const b=bookings.find(b=>b.staff_booking_id===r.external_id);return <div key={r.id} className="rounded border p-3 text-sm space-y-2"><p>{r.details?.professional_name} · {r.details?.method}</p><Button size="sm" variant="ghost" onClick={async()=>{try{await navigator.clipboard.writeText(r.id);toast.success("Protocolo copiado");}catch{toast.error("Não foi possível copiar o protocolo");}}}>Copiar protocolo</Button><p>{r.details?.slot?new Date(r.details.slot).toLocaleString('pt-BR'):''} · {r.status==='cancel_requested'?'Cancelamento solicitado':b?.integration_status||r.status}</p>{r.status==='unknown'&&<p>Confirmação pendente. Atualize o histórico antes de fazer outra reserva.</p>}{r.status==='sent'&&!['concluido','cancelado','rejeitado'].includes(b?.integration_status)&&<Button size="sm" variant="outline" disabled={busy} onClick={()=>cancel(r.id)}>Solicitar cancelamento</Button>}</div>;})}{bookings.filter(b=>!requests.some(r=>r.external_id===b.staff_booking_id)).map(b=><div key={b.id} className="rounded border p-3 text-sm">{b.professional_name} · {b.slot?new Date(b.slot).toLocaleString('pt-BR'):''} · {b.integration_status}</div>)}</CardContent></Card>
 </div>}</PersonaLayout>;
}
