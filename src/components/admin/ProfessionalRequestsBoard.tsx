import { useEffect,useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/** Oversight of external pending operations; never manufactures supplier confirmation. */
export function ProfessionalRequestsBoard({orgId}:{orgId:string}){
  const [rows,setRows]=useState<any[]>([]),[ledger,setLedger]=useState<any[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
  useEffect(()=>{
    let live=true;setLoading(true);setError('');setRows([]);setLedger([]);
    void (async()=>{
      try{
        const [requests,credits]=await Promise.all([
          (supabase as any).from('professional_booking_requests').select('id,status,created_at,external_id,details,credit_reserved,alunos!inner(nome,organization_id)').eq('alunos.organization_id',orgId).order('created_at',{ascending:false}).limit(100),
          (supabase as any).from('professional_credit_ledger').select('id,booking_request_id,delta,reason,created_at').eq('organization_id',orgId).order('created_at',{ascending:false}).limit(100),
        ]);
        if(requests.error||credits.error)throw requests.error||credits.error;
        if(live){setRows(requests.data||[]);setLedger(credits.data||[]);}
      }catch{if(live)setError('Não foi possível carregar as operações externas deste condomínio.');}
      finally{if(live)setLoading(false);}
    })();
    return()=>{live=false;};
  },[orgId,revision]);
  return <Card><CardHeader><CardTitle>Profissionais externos e créditos</CardTitle></CardHeader><CardContent className="space-y-4"><Button variant="outline" disabled={loading} onClick={()=>setRevision(r=>r+1)}>Atualizar registros</Button>
    {loading?<p role="status">Carregando…</p>:error?<p role="alert">{error}</p>:<><p className="text-sm text-muted-foreground">Últimas 100 solicitações. Resposta incerta exige conciliação com o fornecedor; esta tela não confirma nem estorna uma operação sem retorno autorizado.</p>{!rows.length?<p>Nenhuma solicitação externa.</p>:rows.map(row=><div key={row.id} className="rounded border p-3 text-sm space-y-1"><strong>{row.alunos?.nome||'Morador'} · {row.details?.professional_name||'Profissional'}</strong><p>{row.status} · {new Date(row.created_at).toLocaleString('pt-BR')}</p><p className="break-all text-xs">Solicitação: {row.id}{row.external_id?' · Fornecedor: '+row.external_id:''}</p>{['unknown','dispatching','cancel_requested'].includes(row.status)&&<p className="text-amber-600">Acompanhamento necessário junto ao fornecedor.</p>}</div>)}<details><summary className="cursor-pointer text-sm">Últimos 100 débitos e estornos de reservas</summary>{ledger.map(entry=><p key={entry.id} className="mt-2 break-all text-xs">{new Date(entry.created_at).toLocaleString('pt-BR')} · {entry.delta>0?'+':''}{entry.delta} crédito · {entry.reason} · {entry.booking_request_id||'Registro histórico'}</p>)}</details></>}
  </CardContent></Card>;
}
