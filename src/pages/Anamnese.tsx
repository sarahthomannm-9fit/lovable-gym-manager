import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const PAR_Q_QUESTIONS = [
  'Seu médico já mencionou que você possui algum problema cardíaco e que só deveria realizar atividade física supervisionada por profissionais de saúde?',
  'Você sente dores no peito quando pratica atividade física?',
  'No último mês, você sentiu dores no peito quando praticou atividade física?',
  'Você apresenta desequilíbrio devido a tontura e/ou perda de consciência?',
  'Você possui algum problema ósseo ou articular que poderia ser piorado pela atividade física?',
  'Você toma atualmente algum medicamento para pressão arterial e/ou problema cardíaco?',
  'Sabe de alguma outra razão pela qual você não deve realizar atividade física?',
];

export function Anamnese() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'loading' | 'form' | 'done' | 'error' | 'already'>('loading');
  const [alunoNome, setAlunoNome] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState({ objetivos: '', restricoes: '', medicamentos: '', historico: '' });

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    loadAnamnese();
  }, [token]);

  const loadAnamnese = async () => {
    const { data, error } = await supabase
      .from('anamnese_respostas')
      .select('*, alunos(nome)')
      .eq('token', token!)
      .single();

    if (error || !data) { setStatus('error'); setLoading(false); return; }
    if (data.status === 'preenchido') { setStatus('already'); setLoading(false); return; }

    setAlunoNome((data as any).alunos?.nome || 'Aluno');
    setStatus('form');
    setLoading(false);
  };

  const handleSubmit = async () => {
    // Validate all PAR-Q answered
    const unanswered = PAR_Q_QUESTIONS.filter((_, i) => !answers[`q${i}`]);
    if (unanswered.length > 0) return;

    setSubmitting(true);
    const respostas = {
      par_q: PAR_Q_QUESTIONS.map((q, i) => ({ pergunta: q, resposta: answers[`q${i}`] })),
      ...extras,
    };

    const { error } = await supabase
      .from('anamnese_respostas')
      .update({ respostas, status: 'preenchido', preenchido_em: new Date().toISOString() })
      .eq('token', token!);

    setSubmitting(false);
    if (error) { setStatus('error'); return; }
    setStatus('done');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-lg font-semibold">Link inválido ou expirado</p>
            <p className="text-sm text-muted-foreground">Entre em contato com seu studio para obter um novo link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'already' || status === 'done') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-primary" />
            <p className="text-lg font-semibold">Questionário já preenchido!</p>
            <p className="text-sm text-muted-foreground">Obrigado por enviar suas informações. Seu instrutor já tem acesso aos dados.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pt-6">
          <h1 className="text-2xl font-bold">Anamnese — PAR-Q</h1>
          <p className="text-muted-foreground">Olá, <strong>{alunoNome}</strong>! Preencha o questionário abaixo para iniciarmos com segurança.</p>
        </div>

        {/* PAR-Q */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questionário PAR-Q</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {PAR_Q_QUESTIONS.map((q, i) => (
              <div key={i} className="space-y-2">
                <Label className="text-sm leading-relaxed">{i + 1}. {q}</Label>
                <RadioGroup
                  value={answers[`q${i}`] || ''}
                  onValueChange={(v) => setAnswers(prev => ({ ...prev, [`q${i}`]: v }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id={`q${i}-sim`} />
                    <Label htmlFor={`q${i}-sim`}>Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id={`q${i}-nao`} />
                    <Label htmlFor={`q${i}-nao`}>Não</Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Extras */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Quais são seus objetivos com o treino?</Label>
              <Textarea value={extras.objetivos} onChange={e => setExtras(p => ({ ...p, objetivos: e.target.value }))} placeholder="Ex: emagrecer, ganhar massa, melhorar postura..." />
            </div>
            <div>
              <Label>Possui alguma restrição física ou lesão?</Label>
              <Textarea value={extras.restricoes} onChange={e => setExtras(p => ({ ...p, restricoes: e.target.value }))} placeholder="Ex: hérnia de disco, tendinite..." />
            </div>
            <div>
              <Label>Medicamentos em uso</Label>
              <Textarea value={extras.medicamentos} onChange={e => setExtras(p => ({ ...p, medicamentos: e.target.value }))} placeholder="Liste os medicamentos que usa regularmente" />
            </div>
            <div>
              <Label>Histórico de atividade física</Label>
              <Textarea value={extras.historico} onChange={e => setExtras(p => ({ ...p, historico: e.target.value }))} placeholder="Ex: praticou musculação por 2 anos, sedentário há 6 meses..." />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={submitting || PAR_Q_QUESTIONS.some((_, i) => !answers[`q${i}`])}
          className="w-full h-12 text-base"
        >
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar Questionário'}
        </Button>

        <p className="text-center text-xs text-muted-foreground pb-8">
          Suas informações são confidenciais e serão usadas apenas pelo seu instrutor.
        </p>
      </div>
    </div>
  );
}
