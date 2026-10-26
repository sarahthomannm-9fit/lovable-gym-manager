import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function OperationsActivation({orgId,onActivated}:{orgId:string;onActivated:()=>void}) {
  const [metrics,setMetrics]=useState<any>(null);
  const [ready,setReady]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[revision,setRevision]=useState(0);
  useEffect(()=>{
    let current=true;
    setMetrics(null);setReady(false);setError('');setLoading(true);
    void (async()=>{
      try {
        const db=supabase as any;
        const [usage,readiness]=await Promise.all([
          db.rpc('organization_common_area_metrics',{p_organization_id:orgId}),
          db.rpc('organization_operation_readiness',{p_org_id:orgId}),
        ]);
        if(usage.error||readiness.error)throw usage.error||readiness.error;
        if(readiness.data?.organization_id!==orgId)throw new Error('Condomínio divergente.');
        if(current){setMetrics(usage.data);setReady(readiness.data.ready_for_activation===true);}
      } catch {if(current)setError('Falha ao consultar a operação. Atualize antes de ativar.');}
      finally {if(current)setLoading(false);}
    })();
    return()=>{current=false;};
  },[orgId,revision]);
  const activate=async()=>{
    if(busy||loading||!ready)return;
    setBusy(true);
    try {
      const {error}=await (supabase as any).rpc('activate_organization_operation',{p_organization_id:orgId});
      if(error)throw error;
      toast.success('Etapa operacional registrada com os pré-requisitos atuais.');onActivated();
    } catch(e){toast.error((e as Error).message||'Não foi possível ativar.');setReady(false);}
    finally {setBusy(false);}
  };
  return <Card><CardHeader><CardTitle>Operação e utilização</CardTitle></CardHeader><CardContent className="space-y-4">
    {loading?<p role="status">Consultando operação…</p>:error?<p role="alert">{error}</p>:<div className="grid gap-3 md:grid-cols-2"><div><p className="text-sm font-medium">Áreas comuns · 30 dias</p>{!metrics?.areas?.length&&<p className="text-sm text-muted-foreground">Nenhuma utilização registrada.</p>}{metrics?.areas?.map((x:any)=><p key={x.area} className="text-sm text-muted-foreground">{x.area}: {x.reservas} reservas</p>)}</div><div><p className="text-sm font-medium">Serviços · 30 dias</p>{!metrics?.servicos?.length&&<p className="text-sm text-muted-foreground">Nenhuma solicitação registrada.</p>}{metrics?.servicos?.map((x:any)=><p key={x.tipo} className="text-sm text-muted-foreground">{x.tipo}: {x.total} solicitados · {x.em_aberto} em aberto</p>)}</div></div>}
    {!loading&&!error&&!ready&&<p className="text-sm text-amber-600">Conclua os pré-requisitos da entrega e atualize para liberar a ativação.</p>}
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={loading||busy} onClick={()=>setRevision(value=>value+1)}>Atualizar operação</Button><Button disabled={loading||busy||!ready||!!error} onClick={activate}>{busy?'Registrando…':'Ativar operação recorrente'}</Button></div>
  </CardContent></Card>;
}
