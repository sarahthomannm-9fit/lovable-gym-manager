import { useCallback,useEffect,useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
const labels:Record<string,string>={sindico:'Síndico',professor:'Coach',user:'Morador',manager:'Gestor',corporate:'Corporativo'};
export function OrganizationMembers({orgId}:{orgId:string}) {
  const {refresh}=useOperationalContext();
  const [members,setMembers]=useState<any[]>([]),[users,setUsers]=useState<any[]>([]);
  const [userId,setUserId]=useState(''),[role,setRole]=useState('user');
  const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const load=useCallback(async()=>{
    setLoading(true);setError('');setMembers([]);
    try{
      const [m,u]=await Promise.all([supabase.from('organization_members').select('id,user_id,papel').eq('organization_id',orgId),supabase.functions.invoke('manage-users',{body:{action:'list'}})]);
      if(m.error||u.error||u.data?.error)throw m.error||u.error||new Error(u.data.error);
      setMembers(m.data||[]);setUsers(u.data?.users||[]);
    }catch{setError('Não foi possível carregar vínculos e contas.');}finally{setLoading(false);}
  },[orgId]);
  useEffect(()=>{void load();},[load]);
  const assign=async(id:string,papel:string,remove=false)=>{
    if(busy||!id)return;setBusy(true);
    try{
      const {error}=await (supabase as any).rpc('assign_organization_member',{p_org:orgId,p_user:id,p_role:papel,p_remove:remove});
      if(error)throw error;
      toast.success(remove?'Vínculo removido.':'Vínculo salvo.');setUserId('');await load();await refresh();
    }catch(e){toast.error((e as Error).message||'Não foi possível alterar o vínculo.');}finally{setBusy(false);}
  };
  return <Card><CardHeader><CardTitle>Contas e vínculos do condomínio</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">Vincule uma conta existente ou crie um convite. Ao vincular um coach, o cadastro operacional de profissional também é ativado.</p>
    <div className="flex gap-2 flex-wrap"><Select value={userId} onValueChange={setUserId}><SelectTrigger className="min-w-52 flex-1"><SelectValue placeholder="Escolha uma conta existente"/></SelectTrigger><SelectContent>{users.map(u=><SelectItem key={u.user_id} value={u.user_id}>{u.email}</SelectItem>)}</SelectContent></Select><Select value={role} onValueChange={setRole}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(labels).map(([id,label])=><SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select><Button disabled={busy||!userId} onClick={()=>assign(userId,role)}>Vincular conta</Button></div>
    {loading?<p role="status">Carregando vínculos…</p>:error?<div role="alert">{error}<Button onClick={load}>Tentar novamente</Button></div>:!members.length?<p>Nenhum vínculo cadastrado.</p>:members.map(m=><div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"><span>{users.find(u=>u.user_id===m.user_id)?.email||m.user_id} · {labels[m.papel]||m.papel}</span><Button disabled={busy} variant="outline" size="sm" onClick={()=>{if(confirm('Remover este acesso do condomínio?'))void assign(m.user_id,m.papel,true);}}>Remover vínculo</Button></div>)}
  </CardContent></Card>;
}
