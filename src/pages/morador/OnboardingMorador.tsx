import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const goals = ['Hipertrofia', 'Emagrecimento', 'Postural e mobilidade', 'Cardio', 'Força', 'Funcional'];

export default function OnboardingMorador() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [alunoId, setAlunoId] = useState('');
  const [organizations, setOrganizations] = useState<{ id: string; nome: string }[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    consentimento: false, restricoes: '', lesoes: '', historico: '', cirurgias: '', dor: false, sinais: '', observacoes: '', objetivo: '',
  });

  useEffect(() => {
    (async () => {
      const [{ data: orgs }, { data: userData }] = await Promise.all([
        (supabase as any).from('organizations').select('id, nome').eq('tipo', 'condominio').eq('status', 'ativo').order('nome'),
        supabase.auth.getUser(),
      ]);
      setOrganizations(orgs || []);
      if (userData.user) {
        const pendingId = sessionStorage.getItem('9fit:onboarding:aluno');
        const { data: aluno } = await (supabase as any).from('alunos').select('id, organization_id').eq(pendingId ? 'id' : 'user_id', pendingId || userData.user.id).maybeSingle();
        if (aluno) { setAlunoId(aluno.id); setOrganizationId(aluno.organization_id || ''); sessionStorage.removeItem('9fit:onboarding:aluno'); }
      }
    })();
  }, []);

  const submitObjective = async () => {
    if (!form.objetivo) return;
    const payload = { consentimento: true, restricoes: form.restricoes.split(',').map((x) => x.trim()).filter(Boolean), lesoes_atuais: form.lesoes.split(',').map((x) => x.trim()).filter(Boolean), historico_lesoes: form.historico, cirurgias: form.cirurgias, dor_atual: form.dor, sinais_alerta: form.sinais.split(',').map((x) => x.trim()).filter(Boolean), observacoes: form.observacoes, objetivo: form.objetivo };
    const { error } = await (supabase as any).rpc('submit_student_safety_onboarding', { p_aluno_id: alunoId, p_organization_id: organizationId, p_payload: payload });
    if (error) return toast.error(error.message);
    toast.success('Onboarding concluído.'); navigate('/morador');
  };

  const submit = async () => {
    if (!organizationId || !alunoId) return toast.error('Selecione o condomínio e confirme seu cadastro.');
    if (!form.consentimento) return toast.error('Você precisa aceitar o consentimento para continuar.');
    setSaving(true);
    const payload = {
      consentimento: form.consentimento,
      restricoes: form.restricoes.split(',').map((x) => x.trim()).filter(Boolean),
      lesoes_atuais: form.lesoes.split(',').map((x) => x.trim()).filter(Boolean),
      historico_lesoes: form.historico,
      cirurgias: form.cirurgias,
      dor_atual: form.dor,
      sinais_alerta: form.sinais.split(',').map((x) => x.trim()).filter(Boolean),
      observacoes: form.observacoes,
    };
    const { data, error } = await (supabase as any).rpc('submit_student_safety_onboarding', { p_aluno_id: alunoId, p_organization_id: organizationId, p_payload: payload });
    if (error) toast.error(error.message);
    else { toast.success(data?.risco === 'baixo' ? 'Triagem concluída.' : 'Triagem enviada para avaliação profissional.'); setStep(2); }
    setSaving(false);
  };

  return <div className="min-h-screen bg-background p-4 sm:p-8"><div className="mx-auto max-w-2xl space-y-6">
    <div><p className="text-sm text-primary font-medium">NINE LIVING · ONBOARDING</p><h1 className="font-display text-3xl font-normal">Vamos preparar seu treino</h1><p className="text-muted-foreground">Responda algumas perguntas para que o plano respeite seu contexto.</p></div>
    <div className="flex gap-2 text-xs text-muted-foreground"><span className={step === 1 ? 'text-primary font-medium' : ''}>1. Segurança</span><span>→</span><span className={step === 2 ? 'text-primary font-medium' : ''}>2. Objetivo</span></div>
    {step === 1 ? <Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Triagem de segurança</CardTitle></CardHeader><CardContent className="space-y-4">
      <div><Label>Condomínio</Label><Select value={organizationId} onValueChange={setOrganizationId}><SelectTrigger><SelectValue placeholder="Escolha seu condomínio" /></SelectTrigger><SelectContent>{organizations.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Restrições médicas (separe por vírgula)</Label><Input value={form.restricoes} onChange={(e) => setForm({ ...form, restricoes: e.target.value })} placeholder="Ex.: hipertensão, diabetes" /></div>
      <div><Label>Lesões atuais (separe por vírgula)</Label><Input value={form.lesoes} onChange={(e) => setForm({ ...form, lesoes: e.target.value })} placeholder="Ex.: joelho direito" /></div>
      <div><Label>Histórico de lesões</Label><Textarea value={form.historico} onChange={(e) => setForm({ ...form, historico: e.target.value })} /></div>
      <div><Label>Cirurgias ou recomendações profissionais</Label><Textarea value={form.cirurgias} onChange={(e) => setForm({ ...form, cirurgias: e.target.value })} /></div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.dor} onCheckedChange={(checked) => setForm({ ...form, dor: checked === true })} /> Sinto dor ou desconforto atualmente</label>
      <div><Label>Sinais de alerta ou observações importantes</Label><Textarea value={form.sinais} onChange={(e) => setForm({ ...form, sinais: e.target.value })} /></div>
      <label className="flex items-start gap-2 text-sm"><Checkbox checked={form.consentimento} onCheckedChange={(checked) => setForm({ ...form, consentimento: checked === true })} /><span>Confirmo que as informações são verdadeiras e autorizo seu uso para orientar a avaliação física e o treinamento.</span></label>
      <Button className="w-full" disabled={saving} onClick={submit}>{saving ? 'Enviando…' : 'Continuar'}</Button>
    </CardContent></Card> : <Card><CardHeader><CardTitle>Qual é seu objetivo?</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">{goals.map((goal) => <button key={goal} type="button" onClick={() => setForm({ ...form, objetivo: goal })} className={form.objetivo === goal ? 'rounded-sm border-2 border-primary bg-primary/10 p-4 text-left font-medium' : 'rounded-sm border p-4 text-left hover:border-primary'}>{goal}</button>)}</div>
      <Button className="w-full" disabled={!form.objetivo} onClick={submitObjective}>Concluir onboarding</Button>
    </CardContent></Card>}
  </div></div>;
}

