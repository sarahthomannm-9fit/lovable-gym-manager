import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOperationalContext } from '@/hooks/useOperationalContext';
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
  const [params] = useSearchParams();
  const { refresh } = useOperationalContext();
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState('');
  const [step, setStep] = useState(1);
  const [alunoId, setAlunoId] = useState('');
  const [organizations, setOrganizations] = useState<{ id: string; nome: string }[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    consentimento: false, restricoes: '', lesoes: '', historico: '', cirurgias: '', dor: false, sinais: '', observacoes: '', objetivo: '',
  });

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data: identity, error: identityError } = await supabase.auth.getUser();
        if (identityError || !identity.user) throw new Error('Entre novamente para continuar.');
        let pending: any = identity.user.user_metadata?.resident_entry || {};
        try { const saved = JSON.parse(localStorage.getItem('nine:resident-entry') || 'null'); if (saved?.email === identity.user.email?.toLowerCase()) pending = saved; } catch { /* optional local draft */ }
        const orgId = params.get('organization') || pending.organization_id;
        let query = supabase.from('alunos').select('id, organization_id').eq('user_id', identity.user.id);
        if (orgId) query = query.eq('organization_id', orgId);
        const { data: existing, error: lookupError } = await query.maybeSingle();
        if (lookupError) throw lookupError;
        let student = existing;
        if (!student && orgId) {
          const { data: id, error } = await (supabase as any).rpc('start_resident_onboarding', { p_organization_id: orgId, p_nome: pending.nome || identity.user.user_metadata?.nome || identity.user.email?.split('@')[0], p_email: identity.user.email, p_unidade: pending.unidade || '' });
          if (error) throw error;
          student = { id, organization_id: orgId };
        }
        if (!student?.organization_id) throw new Error('Inicie seu cadastro pela página de entrada ou aceite o convite do condomínio.');
        const { data: org } = await supabase.from('organizations').select('id,nome').eq('id', student.organization_id).single();
        if (live) { setAlunoId(student.id); setOrganizationId(student.organization_id); setOrganizations(org ? [org] : []); }
        await refresh(identity.user.id);
        localStorage.removeItem('nine:resident-entry');
      } catch (e) { if (live) setInitError((e as Error).message || 'Falha ao carregar cadastro.'); }
      finally { if (live) setInitializing(false); }
    })();
    return () => { live = false; };
  }, []);

  const submitObjective = async () => {
    if (!form.objetivo || saving) return;
    setSaving(true);
    try {
    if (!form.consentimento || !alunoId || !organizationId) throw new Error('Confirme a triagem antes de enviar.');
    const payload = { consentimento: form.consentimento, consent_version:'triagem-2026-10-26-v1', restricoes: form.restricoes.split(',').map((x) => x.trim()).filter(Boolean), lesoes_atuais: form.lesoes.split(',').map((x) => x.trim()).filter(Boolean), historico_lesoes: form.historico, cirurgias: form.cirurgias, dor_atual: form.dor, sinais_alerta: form.sinais.split(',').map((x) => x.trim()).filter(Boolean), observacoes: form.observacoes, objetivo: form.objetivo };
    const { error } = await (supabase as any).rpc('submit_student_safety_onboarding', { p_aluno_id: alunoId, p_organization_id: organizationId, p_payload: payload });
    if (error) return toast.error(error.message);
    await refresh(); toast.success('Onboarding concluído.'); navigate('/morador');
    } catch { toast.error('Falha ao enviar. Suas respostas continuam nesta tela.'); }
    finally { setSaving(false); }
  };

  const submit = async () => {
    if (!organizationId || !alunoId) return toast.error('Selecione o condomínio e confirme seu cadastro.');
    if (!form.consentimento) return toast.error('Você precisa aceitar o consentimento para continuar.');
    // Submit health data and objective together to avoid resetting a review twice.
    setStep(2);

  };

  if (initializing) return <div className="p-8" role="status">Confirmando seu cadastro…</div>;
  if (initError) return <div className="p-8 space-y-4" role="alert"><p>{initError}</p><Button onClick={() => navigate('/entrada')}>Voltar à entrada</Button><Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button></div>;
  if(!initializing&&!initError&&!form.consentimento)return <div className="min-h-screen bg-background p-6"><Card className="mx-auto max-w-xl"><CardHeader><CardTitle>Antes da sua triagem</CardTitle></CardHeader><CardContent className="space-y-4"><p>Vamos solicitar restrições, lesões, cirurgias, dor e seu objetivo para orientar a avaliação e o treino. As respostas ficam disponíveis para você e para profissionais autorizados do seu condomínio. O painel do síndico não recebe sua anamnese.</p><p className="text-sm text-muted-foreground">Consentimento: triagem-2026-10-26-v1. Você pode procurar o suporte para solicitar acesso ou correção dos seus dados.</p><label className="flex gap-3"><Checkbox checked={false} onCheckedChange={value=>{if(value===true)setForm({...form,consentimento:true});}}/><span>Li a finalidade e autorizo o uso das respostas para minha avaliação e meu treinamento.</span></label></CardContent></Card></div>;
  return <div className="min-h-screen bg-background p-4 sm:p-8"><div className="mx-auto max-w-2xl space-y-6">
    <div><p className="text-sm text-primary font-medium">NINE LIVING · ONBOARDING</p><h1 className="font-display text-3xl font-normal">Vamos preparar seu treino</h1><p className="text-muted-foreground">Responda algumas perguntas para que o plano respeite seu contexto.</p></div>
    <div className="flex gap-2 text-xs text-muted-foreground"><span className={step === 1 ? 'text-primary font-medium' : ''}>1. Segurança</span><span>→</span><span className={step === 2 ? 'text-primary font-medium' : ''}>2. Objetivo</span></div>
    {step === 1 ? <Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Triagem de segurança</CardTitle></CardHeader><CardContent className="space-y-4">
      <div><Label>Condomínio</Label><Select value={organizationId} disabled onValueChange={setOrganizationId}><SelectTrigger><SelectValue placeholder="Escolha seu condomínio" /></SelectTrigger><SelectContent>{organizations.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Restrições médicas (separe por vírgula)</Label><Input value={form.restricoes} onChange={(e) => setForm({ ...form, restricoes: e.target.value })} placeholder="Ex.: hipertensão, diabetes" /></div>
      <div><Label>Lesões atuais (separe por vírgula)</Label><Input value={form.lesoes} onChange={(e) => setForm({ ...form, lesoes: e.target.value })} placeholder="Ex.: joelho direito" /></div>
      <div><Label>Histórico de lesões</Label><Textarea value={form.historico} onChange={(e) => setForm({ ...form, historico: e.target.value })} /></div>
      <div><Label>Cirurgias ou recomendações profissionais</Label><Textarea value={form.cirurgias} onChange={(e) => setForm({ ...form, cirurgias: e.target.value })} /></div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.dor} onCheckedChange={(checked) => setForm({ ...form, dor: checked === true })} /> Sinto dor ou desconforto atualmente</label>
      <div><Label>Sinais de alerta ou observações importantes</Label><Textarea value={form.sinais} onChange={(e) => setForm({ ...form, sinais: e.target.value })} /></div>
      <div><Label>Observações adicionais</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
      <label className="flex items-start gap-2 text-sm"><Checkbox checked={form.consentimento} onCheckedChange={(checked) => setForm(checked===true?{...form,consentimento:true}:{consentimento:false,restricoes:'',lesoes:'',historico:'',cirurgias:'',dor:false,sinais:'',observacoes:'',objetivo:''})} /><span>Confirmo que as informações são verdadeiras e autorizo seu uso para orientar a avaliação física e o treinamento.</span></label>
      <Button className="w-full" disabled={saving} onClick={submit}>{saving ? 'Enviando…' : 'Continuar'}</Button>
    </CardContent></Card> : <Card><CardHeader><CardTitle>Qual é seu objetivo?</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">{goals.map((goal) => <button key={goal} type="button" onClick={() => setForm({ ...form, objetivo: goal })} className={form.objetivo === goal ? 'rounded-sm border-2 border-primary bg-primary/10 p-4 text-left font-medium' : 'rounded-sm border p-4 text-left hover:border-primary'}>{goal}</button>)}</div>
      <Button variant="outline" disabled={saving} onClick={() => setStep(1)}>Voltar à triagem</Button>
      <Button className="w-full" disabled={!form.objetivo || saving} onClick={submitObjective}>{saving ? 'Enviando…' : 'Concluir onboarding'}</Button>
    </CardContent></Card>}
  </div></div>;
}
