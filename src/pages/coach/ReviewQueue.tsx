import { useSupabaseStudents } from '@/hooks/useSupabaseStudents';
import { Textarea } from '@/components/ui/textarea';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Review = { id: string; aluno_id: string; organization_id: string | null; objetivo: string | null; nivel: string | null; resumo: string | null; status: string; created_at: string };

export default function ReviewQueue() {
  const { activeOrg } = useOperationalContext();
  const {students}=useSupabaseStudents();
  const [items, setItems] = useState<Review[]>([]);
  const [reasons, setReasons] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const [safety, setSafety] = useState<Record<string,any>>({});
  const [loading, setLoading] = useState(true);
  const load = async () => {
    if (!activeOrg) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await (supabase as any).from('treinos_ia_fila').select('id, aluno_id, organization_id, objetivo, nivel, resumo, status, created_at').eq('status', 'pendente').eq('organization_id', activeOrg.id).order('created_at');
    if (error) toast.error(error.message); else setItems(data || []);
    const { data: triages, error: safetyError } = await supabase.from('student_safety_onboarding').select('*').eq('organization_id', activeOrg.id);
    if (safetyError) toast.error(safetyError.message);
    setSafety(Object.fromEntries((triages || []).map(t => [t.aluno_id, t])));
    setLoading(false);
  };
  useEffect(() => { load(); }, [activeOrg?.id]);
  const decide = async (id: string, status: 'aprovado' | 'rejeitado') => {
    if(busy)return;
    if((reasons[id]||'').trim().length<3)return toast.error('Informe uma justificativa para a decisão.');
    setBusy(true);
    const { error } = await (supabase as any).rpc('review_student_safety_decision', { p_queue: id, p_decision: status, p_reason: reasons[id].trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(status === 'aprovado' ? 'Caso aprovado para prescrição.' : 'Caso rejeitado e devolvido para revisão.');
    load();
  };
  return <PersonaLayout title="Revisões de segurança"><div className="p-6 space-y-6"><div><h1 className="text-2xl font-bold">Revisões de segurança</h1><p className="text-sm text-muted-foreground">Avalie casos que não podem receber prescrição automática.</p></div>
    {loading ? <p className="text-muted-foreground">Carregando fila…</p> : !items.length ? <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma revisão pendente.</CardContent></Card> : <div className="grid gap-4">{items.map((item) => <Card key={item.id}><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="text-lg">{students.find(p=>p.id===item.aluno_id)?.nome||'Morador '+item.aluno_id.slice(0,8)}</CardTitle><p className="text-sm text-muted-foreground">{item.resumo || 'Triagem requer avaliação profissional.'}</p></div><Badge variant="destructive">Pendente</Badge></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2 text-sm"><Badge variant="outline">Objetivo: {item.objetivo || 'não informado'}</Badge>{item.nivel && <Badge variant="outline">Nível: {item.nivel}</Badge>}<Badge variant="outline">Recebido: {new Date(item.created_at).toLocaleDateString('pt-BR')}</Badge></div><div className="text-sm space-y-2"><p>Risco: {safety[item.aluno_id]?.risco || 'Não informado'}</p><p>Restrições: {(safety[item.aluno_id]?.restricoes || []).join(', ') || 'Nenhuma informada'}</p><p>Lesões atuais: {String(safety[item.aluno_id]?.lesoes_atuais || 'Não informadas')}</p></div><details className="text-sm"><summary>Ver anamnese completa</summary><dl className="space-y-2 mt-2">{[['Histórico de lesões','historico_lesoes'],['Cirurgias','cirurgias'],['Sinais de alerta','sinais_alerta'],['Observações','observacoes'],['Objetivo','objetivo']].map(([label,key])=><div key={key}><dt className="font-medium">{label}</dt><dd>{Array.isArray(safety[item.aluno_id]?.[key])?safety[item.aluno_id][key].join(', ')||'Nenhum informado':safety[item.aluno_id]?.[key]||'Não informado'}</dd></div>)}<div><dt className="font-medium">Dor atual</dt><dd>{safety[item.aluno_id]?.dor_atual?'Sim':'Não informada'}</dd></div></dl></details><Textarea aria-label="Justificativa da decisão" placeholder="Justificativa e orientação profissional" value={reasons[item.id]||''} onChange={e=>setReasons({...reasons,[item.id]:e.target.value})}/><div className="flex gap-2"><Button disabled={busy} onClick={() => decide(item.id, 'aprovado')}>Aprovar avaliação</Button><Button disabled={busy} variant="outline" onClick={() => decide(item.id, 'rejeitado')}>Solicitar revisão</Button></div></CardContent></Card>)}</div>}
  </div></PersonaLayout>;
}
