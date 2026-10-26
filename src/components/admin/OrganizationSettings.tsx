import { useEffect,useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { COMMON_AREAS, RESIDENT_SERVICES, catalogSelection } from '@/lib/operationalCatalog';
export function OrganizationSettings({orgId,onSaved}:{orgId:string;onSaved:()=>void}){
 const {refresh}=useOperationalContext();
 const [form,setForm]=useState({nome:'',status:'ativo',unidades:'',plantao:'',demo:false});
 const [metadata,setMetadata]=useState<Record<string,any>>({});
 const [catalog,setCatalog]=useState({areas:[] as string[],services:[] as string[]});
 const [features,setFeatures]=useState({staff:false,ai_reports:false,public_signup:false});
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  let live=true;setLoading(true);setError('');
  void (async()=>{try{const {data,error}=await supabase.from('organizations').select('nome,status,metadata').eq('id',orgId).single();if(error)throw error;if(live){const m=(data.metadata||{}) as Record<string,any>;setMetadata(m);setFeatures({staff:m.features?.staff===true,ai_reports:m.features?.ai_reports===true,public_signup:m.features?.public_signup===true});setForm({nome:data.nome,status:data.status,unidades:m.total_unidades?String(m.total_unidades):'',plantao:m.plantao||'',demo:m.is_demo===true});}}catch{if(live)setError('Falha ao carregar configurações.');}finally{if(live)setLoading(false);}})();
  return()=>{live=false;};
 },[orgId]);
 useEffect(()=>{setCatalog({areas:catalogSelection(metadata.operational_catalog?.areas,COMMON_AREAS),services:catalogSelection(metadata.operational_catalog?.services,RESIDENT_SERVICES)});},[metadata]);
 const save=async()=>{
  if(busy)return;
  if(form.nome.trim().length<2||(form.unidades&&(!Number.isInteger(Number(form.unidades))||Number(form.unidades)<1)))return toast.error('Confira nome e número de unidades.');
  if(form.demo&&!metadata.is_demo&&!confirm('Marcar esta organização como demonstração? Isso permitirá a limpeza dos seus dados operacionais na tela de demonstração.'))return;
  setBusy(true);
  try{const next={...metadata,operational_catalog:catalog,features:{...(metadata.features||{}),...features},total_unidades:form.unidades?Number(form.unidades):null,plantao:form.plantao.trim(),is_demo:form.demo};const {error}=await supabase.from('organizations').update({nome:form.nome.trim(),status:form.status,metadata:next}).eq('id',orgId).select('id').single();if(error)throw error;setMetadata(next);toast.success('Organização atualizada.');await refresh();onSaved();}
  catch(e){toast.error((e as Error).message||'Falha ao salvar.');}finally{setBusy(false);}
 };
 return <Card><CardHeader><CardTitle>Configurações do condomínio</CardTitle></CardHeader><CardContent>{loading?<p role="status">Carregando…</p>:error?<p role="alert">{error}</p>:<fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
  <label className="text-sm">Nome<Input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/></label>
  <label className="text-sm">Status<select className="mt-1 w-full rounded border bg-background p-2" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="ativo">Ativo</option><option value="suspenso">Suspenso</option><option value="pendente_validacao">Pendente de validação</option></select></label>
  <label className="text-sm">Total de unidades<Input type="number" min="1" value={form.unidades} onChange={e=>setForm({...form,unidades:e.target.value})}/></label>
  <label className="text-sm">Plantão contratado<Input value={form.plantao} onChange={e=>setForm({...form,plantao:e.target.value})} placeholder="Dias, horários e frequência"/></label>
  <label className="flex items-center gap-2 text-sm sm:col-span-2"><Checkbox checked={form.demo} onCheckedChange={value=>setForm({...form,demo:value===true})}/>Organização de demonstração (permite limpeza dos dados desta organização)</label>
  <div className="space-y-2 sm:col-span-2"><p className="font-medium text-sm">Funcionalidades opcionais — ativar após configuração operacional</p><label className="flex items-center gap-2 text-sm"><Checkbox checked={features.public_signup} onCheckedChange={v=>setFeatures({...features,public_signup:v===true})}/>Permitir autocadastro público de moradores (sem convite)</label><label className="flex items-center gap-2 text-sm"><Checkbox checked={features.staff} onCheckedChange={v=>setFeatures({...features,staff:v===true})}/>Reservas integradas com Staff</label><label className="flex items-center gap-2 text-sm"><Checkbox checked={features.ai_reports} onCheckedChange={v=>setFeatures({...features,ai_reports:v===true})}/>Relatórios de IA</label></div>
  <div className="space-y-3 sm:col-span-2"><p className="font-medium">Áreas e serviços disponíveis neste condomínio</p><p className="text-sm text-muted-foreground">Ative somente recursos reais e autorizados. Serviços são solicitados para receber proposta; não significam atendimento confirmado.</p>{([{key:'areas',title:'Áreas reserváveis',options:COMMON_AREAS},{key:'services',title:'Serviços que podem ser solicitados',options:RESIDENT_SERVICES}] as const).map(group=><div key={group.key} className="space-y-2"><p className="text-sm font-medium">{group.title}</p>{Object.entries(group.options).map(([id,label])=><label key={id} className="flex items-center gap-2 text-sm"><Checkbox checked={catalog[group.key].includes(id)} onCheckedChange={checked=>setCatalog(current=>({...current,[group.key]:checked===true?[...new Set([...current[group.key],id])]:current[group.key].filter(value=>value!==id)}))}/>{label}</label>)}</div>)}</div>
  <Button onClick={save}>{busy?'Salvando…':'Salvar configurações'}</Button>
 </fieldset>}</CardContent></Card>;
}
