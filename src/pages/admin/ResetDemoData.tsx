import { useEffect,useState } from 'react';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { PersonaLayout,PersonaEmptyState } from '@/layouts/PersonaLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
export default function ResetDemoData(){
 const {activeOrg}=useOperationalContext();
 const [demo,setDemo]=useState(false),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[confirmation,setConfirmation]=useState(''),[report,setReport]=useState<Record<string,number>|null>(null);
 useEffect(()=>{setDemo(false);setConfirmation('');setReport(null);if(!activeOrg)return;setLoading(true);void supabase.from('organizations').select('metadata').eq('id',activeOrg.id).single().then(({data,error})=>{if(error)toast.error('Falha ao verificar organização');else setDemo((data?.metadata as any)?.is_demo===true);setLoading(false);});},[activeOrg?.id]);
 const wipe=async()=>{
  if(!activeOrg||!demo||busy||confirmation!=='LIMPAR DEMONSTRACAO')return;
  if(!confirm('Apagar os dados operacionais de demonstração de '+activeOrg.nome+'? A ação não pode ser desfeita pela interface.'))return;
  setBusy(true);
  try{const {data,error}=await (supabase as any).rpc('wipe_demo_organization',{p_org:activeOrg.id,p_confirmation:confirmation});if(error)throw error;setReport(data);setConfirmation('');toast.success('Dados de demonstração removidos desta organização.');}
  catch(e){toast.error((e as Error).message||'Falha ao limpar. Nenhuma exclusão parcial será confirmada.');}finally{setBusy(false);}
 };
 return <PersonaLayout title="Limpar demonstração">{!activeOrg?<PersonaEmptyState/>:<Card className="max-w-2xl"><CardHeader><CardTitle>{activeOrg.nome}</CardTitle></CardHeader><CardContent className="space-y-4">
  {loading?<p role="status">Verificando organização…</p>:!demo?<p>Limpeza bloqueada: esta organização não está marcada como demonstração. Os dados comerciais estão protegidos por esta regra.</p>:<><p>Remove os cadastros operacionais desta organização de demonstração. Contas de acesso e a própria organização são preservadas. Confirme o nome acima antes de prosseguir.</p><label className="block text-sm">Digite LIMPAR DEMONSTRACAO<Input disabled={busy} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><Button variant="destructive" disabled={busy||confirmation!=='LIMPAR DEMONSTRACAO'} onClick={wipe}>{busy?'Limpando…':'Limpar somente esta demonstração'}</Button></>}
  {report&&<pre className="overflow-auto rounded bg-muted p-3 text-sm">{JSON.stringify(report,null,2)}</pre>}
 </CardContent></Card>}</PersonaLayout>;
}
