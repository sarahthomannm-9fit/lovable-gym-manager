import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useSupabaseStudents } from '@/hooks/useSupabaseStudents';
import { CriarTreinoDialog } from '@/components/CriarTreinoDialog';
import { Card,CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PlanosTreino(){
  const {activeOrg}=useOperationalContext();
  const {students}=useSupabaseStudents();
  const [plans,setPlans]=useState<any[]>([]),[counts,setCounts]=useState<Record<string,number>>({});
  const [loading,setLoading]=useState(true),[error,setError]=useState('');
  const load=async()=>{
    setLoading(true);setError('');setPlans([]);setCounts({});
    try{
      if(!activeOrg)return;
      const {data,error}=await supabase.from('planos_treino').select('*').eq('organization_id',activeOrg.id).order('created_at',{ascending:false});
      if(error)throw error;setPlans(data||[]);
      if(data?.length){const {data:ex,error:exError}=await supabase.from('plano_exercicios').select('plano_treino_id').in('plano_treino_id',data.map(p=>p.id)).eq('semana',1);if(exError)throw exError;const next:Record<string,number>={};for(const row of ex||[])next[row.plano_treino_id]=(next[row.plano_treino_id]||0)+1;setCounts(next);}
    }catch(e){setError((e as Error).message||'Não foi possível carregar planos.');}finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[activeOrg?.id]);
  const pupils=students.filter(s=>s.organization_id===activeOrg?.id&&s.status==='ativo'&&s.lifecycle_status==='ativo');
  return <div className="p-4 space-y-5"><div className="flex flex-wrap justify-between gap-3"><h1 className="text-2xl font-display">Planos de treino</h1><CriarTreinoDialog alunos={pupils} organizationId={activeOrg?.id} onCriado={load} trigger={<Button>Criar plano e treino</Button>}/></div>
    <p className="text-sm text-muted-foreground">Cada atribuição passa pelo editor, pela triagem e pelos equipamentos aprovados antes da publicação ao morador.</p>
    {loading?<p role="status">Carregando…</p>:error?<div role="alert">{error}<Button onClick={load}>Carregar novamente</Button></div>:!plans.length?<p>Nenhum plano publicado neste condomínio.</p>:<div className="grid gap-4 md:grid-cols-2">{plans.map(plan=><Card key={plan.id}><CardContent className="p-4 space-y-2"><h2 className="font-medium">{plan.nome}</h2><p className="text-sm">{plan.objetivo} · {plan.semanas} semanas · {counts[plan.id]||0} exercícios por semana</p><CriarTreinoDialog alunos={pupils} organizationId={activeOrg?.id} initialPlanId={plan.id} onCriado={load} trigger={<Button variant="outline">Revisar exercícios e atribuir</Button>}/></CardContent></Card>)}</div>}
  </div>;
}
