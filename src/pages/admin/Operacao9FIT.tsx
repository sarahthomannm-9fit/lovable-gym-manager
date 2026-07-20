import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Dumbbell,
  FileText,
  MessageSquare,
  Network,
  QrCode,
  ShieldCheck,
  User,
} from 'lucide-react';

const demoFlow = [
  { label: 'Dashboard do síndico', path: '/sindico', icon: Building2, detail: 'Adesão, frequência, ocupação, relatório mensal e solicitações.' },
  { label: 'QR → anamnese → treino', path: '/coach', icon: QrCode, detail: 'Fila de anamnese e aprovação do professor em um clique.' },
  { label: 'Check-in do morador', path: '/morador', icon: User, detail: 'Hoje, treino do dia, presença, pagamentos e comunicados.' },
  { label: 'Hub de agentes', path: '/agents', icon: Bot, detail: 'Skills comerciais, financeiras e operacionais executando ações.' },
];

const productRoutes = [
  { area: 'Admin Sara/Rony', route: '/painel', icon: ShieldCheck, value: 'Control Plane, comercial, orgs, relatórios e troca de persona.' },
  { area: 'Síndico', route: '/sindico', icon: Building2, value: 'Prestação de contas da academia como ativo de valorização.' },
  { area: 'Professor', route: '/coach', icon: Dumbbell, value: 'Agenda, alunos, fila de anamnese, treinos e check-ins.' },
  { area: 'Morador', route: '/morador', icon: User, value: 'FitPro PWA: treino, presença, aulas, pagamentos e suporte.' },
  { area: 'Corporate', route: '/corp', icon: Briefcase, value: 'Engajamento, adesão, elegíveis e relatório executivo.' },
  { area: 'FitPro API', route: '/admin/fitpro', icon: Network, value: 'Chaves, eventos e integração com app externo via Edge Function.' },
];

const sellPoints = [
  'Um professor gerencia até 100 condomínios com tecnologia que multiplica a operação humana.',
  'Do QR code ao treino: morador entra sem fricção e professor aprova sem burocracia.',
  'Síndico acompanha dados concretos para assembleia e valorização do imóvel.',
  'Comunidade, saúde e convivência dentro do próprio condomínio.',
];

const neverSay = [
  'Não vender IA como diferencial central: IA é meio, não promessa principal.',
  'Não prometer substituição total do professor: há profissional real por trás.',
  'Não usar termos técnicos em material externo.',
  'Não prometer assinatura eletrônica, portal público ou BI agregado cross-condomínio.',
];

export default function Operacao9FIT() {
  const navigate = useNavigate();

  return (
    <PersonaLayout title="Operação 9FIT" subtitle="Portaria eletrônica do fitness">
      <section className="space-y-6">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4">
          <div className="border border-border/40 bg-card/60 rounded-lg p-6">
            <Badge variant="secondary" className="mb-4">Fonte única de verdade</Badge>
            <h1 className="text-3xl font-display font-semibold mb-3">Portaria eletrônica do fitness</h1>
            <p className="text-muted-foreground max-w-2xl">
              Um único professor de educação física gerencia até 100 condomínios simultaneamente com uma plataforma digital escalável. A venda é modelo, onboarding, dashboard e comunidade — não tecnologia pela tecnologia.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Button variant="premium" onClick={() => navigate('/select-context')}>
                Pré-visualizar persona <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/contratos')}>
                <FileText className="w-4 h-4" /> Contratos
              </Button>
              <Button variant="outline" onClick={() => navigate('/pipeline')}>
                <ClipboardCheck className="w-4 h-4" /> Pipeline
              </Button>
            </div>
          </div>

          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5">
              <h2 className="font-semibold mb-4">Checklist antes de vender/publicar</h2>
              <div className="space-y-3">
                {['Reforça o posicionamento central', 'Mostra dashboard do síndico primeiro', 'CTA claro para visita, QR ou Sara/Rony', 'Evita promessa fora de escopo'].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {demoFlow.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={item.path} className="bg-card/60 border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">0{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1 min-h-10">{item.detail}</p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(item.path)}>
                    Abrir rota <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5">
              <h2 className="font-semibold mb-4">Mapa produto → entrega</h2>
              <div className="space-y-3">
                {productRoutes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <button
                      key={route.route}
                      onClick={() => navigate(route.route)}
                      className="w-full text-left border border-border/30 rounded-md p-3 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{route.area}</span>
                            <code className="text-[10px] text-muted-foreground">{route.route}</code>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{route.value}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-5">
                <h2 className="font-semibold mb-4">O que vender</h2>
                <ul className="space-y-3">
                  {sellPoints.map((point) => (
                    <li key={point} className="flex gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-5">
                <h2 className="font-semibold mb-4">O que nunca comunicar</h2>
                <ul className="space-y-3">
                  {neverSay.map((point) => (
                    <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PersonaLayout>
  );
}