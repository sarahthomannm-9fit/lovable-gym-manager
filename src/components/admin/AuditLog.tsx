import { useCallback,useEffect,useState } from 'react';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card,CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function AuditLog({kind}:{kind:'access'|'prescription'}){
  const {activeOrg}=useOperationalContext();
  const [rows,setRows]=useState<any[]>([]),[page,setPage]=useState(0),[search,setSearch]=useState(''),[date,setDate]=useState('');
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  const load=useCallback(async()=>{
    setLoading(true);setError('');setRows([]);
    try{
      let query=(supabase as any).from(kind==='access'?'user_access_audit':'prescription_audit_log').select('*').order('created_at',{ascending:false}).range(page*50,page*50+49);
      if(activeOrg)query=query.eq('organization_id',activeOrg.id);
      if(date)query=query.gte('created_at',new Date(date+'T00:00:00-03:00').toISOString()).lt('created_at',new Date(new Date(date+'T00:00:00-03:00').getTime()+86400000).toISOString());
      const {data,error}=await query;if(error)throw error;setRows(data||[]);
    }catch{setError('Falha ao carregar auditoria.');}finally{setLoading(false);}
  },[kind,activeOrg?.id,page,date]);
  useEffect(()=>{setPage(0);},[activeOrg?.id]);
  useEffect(()=>{void load();},[load]);
  const filtered=rows.filter(row=>JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  const exportCsv=()=>{
    const values=[['data','acao','usuario','organizacao','detalhes'],...filtered.map(r=>[r.created_at,r.event||r.action,r.user_id||r.actor_user_id||r.actor_id,r.organization_id,JSON.stringify(r.metadata||r.details||r.payload||{})])];
    const csv=values.map(line=>line.map(value=>{let text=String(value??'');if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}).join(',')).join('\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='auditoria-'+kind+'.csv';a.click();URL.revokeObjectURL(url);toast.success('Página exportada.');
  };
  return <div className="space-y-4"><div className="flex gap-2 flex-wrap"><Input className="max-w-xs" placeholder="Buscar nesta página" aria-label="Buscar nesta página" value={search} onChange={e=>setSearch(e.target.value)}/><Input className="w-44" type="date" aria-label="Data da auditoria" value={date} onChange={e=>{setDate(e.target.value);setPage(0);}}/><Button disabled={loading} variant="outline" onClick={load}>Atualizar</Button><Button disabled={loading||!filtered.length} onClick={exportCsv}>Exportar página CSV</Button></div>
    {loading?<p role="status">Carregando auditoria…</p>:error?<div role="alert">{error}<Button onClick={load}>Tentar novamente</Button></div>:!filtered.length?<p>Nenhum registro encontrado.</p>:filtered.map(row=><Card key={row.id}><CardContent className="p-4 space-y-2 text-sm"><p className="font-medium">{row.event||row.action} · {new Date(row.created_at).toLocaleString('pt-BR')}</p><p className="text-muted-foreground">Responsável: {row.user_id||row.actor_user_id||row.actor_id||'—'}</p><p>Treino: {row.treino_id||row.workout_id||'—'}</p><details><summary>Detalhes</summary><pre className="max-h-52 overflow-auto text-xs">{JSON.stringify(row.metadata||row.details||row.payload||{},null,2)}</pre></details></CardContent></Card>)}
    <div className="flex items-center gap-3"><Button disabled={loading||page===0} variant="outline" onClick={()=>setPage(p=>p-1)}>Anterior</Button><span>Página {page+1}</span><Button disabled={loading||rows.length<50} variant="outline" onClick={()=>setPage(p=>p+1)}>Próxima</Button></div>
  </div>;
}
