import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Users, CreditCard, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingConfig {
  tamanho: string;
  cobranca: string;
  equipe: string;
}

const STEPS = [
  {
    key: 'tamanho' as const,
    icon: Users,
    title: 'Quantos alunos você tem?',
    options: [
      { value: '0-10', label: '0 – 10', sub: 'Estúdio pequeno' },
      { value: '10-50', label: '10 – 50', sub: 'Em crescimento' },
      { value: '50-100', label: '50 – 100', sub: 'Operação média' },
      { value: '100+', label: '100+', sub: 'Escala' },
    ],
  },
  {
    key: 'cobranca' as const,
    icon: CreditCard,
    title: 'Como você cobra?',
    options: [
      { value: 'manual', label: 'Manual / PIX', sub: 'Sem automação' },
      { value: 'recorrencia', label: 'Recorrência', sub: 'Cartão automático' },
      { value: 'boleto', label: 'Boleto', sub: 'Emissão manual ou gateway' },
      { value: 'misto', label: 'Misto', sub: 'Combina métodos' },
    ],
  },
  {
    key: 'equipe' as const,
    icon: Briefcase,
    title: 'Você trabalha solo ou tem equipe?',
    options: [
      { value: 'solo', label: 'Solo', sub: 'Eu faço tudo' },
      { value: '1-3', label: '1 – 3 pessoas', sub: 'Equipe enxuta' },
      { value: '4+', label: '4+ pessoas', sub: 'Time completo' },
    ],
  },
];

interface OnboardingWizardProps {
  onComplete: () => void;
  storageKey?: string;
}

export function OnboardingWizard({ onComplete, storageKey = 'fitmanager_onboarding' }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<Partial<OnboardingConfig>>({});
  const [done, setDone] = useState(false);

  const isFinalReview = step === STEPS.length;

  const finish = (cfg: Partial<OnboardingConfig>) => {
    localStorage.setItem(storageKey, JSON.stringify({ ...cfg, completedAt: new Date().toISOString() }));
    setDone(true);
    toast.success('Configuração inicial concluída', { description: 'Redirecionando ao painel...' });
    setTimeout(() => onComplete(), 700);
  };

  const skip = () => {
    localStorage.setItem(storageKey, JSON.stringify({ skipped: true, completedAt: new Date().toISOString() }));
    onComplete();
  };

  if (done || isFinalReview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle2 className="h-14 w-14 mx-auto text-primary mb-2" />
            <CardTitle>Tudo pronto!</CardTitle>
            <CardDescription>Seu workspace está configurado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => finish(config)}>
              Ir para o painel <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const current = STEPS[step];
  const Icon = current.icon;

  const handleSelect = (value: string) => {
    const updated = { ...config, [current.key]: value };
    setConfig(updated);
    if (step < STEPS.length - 1) setStep(step + 1);
    else setStep(STEPS.length); // review
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center text-[12px] font-black text-background font-mono rounded">9F</div>
            <span className="text-xs font-mono text-muted-foreground tracking-widest">FITMANAGER</span>
          </div>
          <div className="flex justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-8 h-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <Icon className="h-8 w-8 mx-auto text-primary mb-2" />
          <CardTitle className="text-lg">{current.title}</CardTitle>
          <CardDescription className="text-xs font-mono">Passo {step + 1} de {STEPS.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {current.options.map(opt => (
            <Button
              key={opt.value}
              variant="outline"
              className="w-full justify-between h-auto py-3 px-4"
              onClick={() => handleSelect(opt.value)}
            >
              <div className="text-left">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          ))}
          <div className="pt-2 flex justify-between">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>← Voltar</Button>
            ) : <div />}
            <Button variant="ghost" size="sm" onClick={skip}>Pular configuração</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
