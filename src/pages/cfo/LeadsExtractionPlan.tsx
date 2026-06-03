import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Phone, ClipboardCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Tier = {
  badge: string;
  badgeVariant: 'destructive' | 'warning' | 'info' | 'success';
  accent: string;
  title: string;
  sub: string;
  leads: string;
  ticket: string;
  rows: { label: string; value: string; sub?: boolean }[];
};

const TIERS: Tier[] = [
  {
    badge: 'TIER 1 — atacar primeiro',
    badgeVariant: 'destructive',
    accent: '#993C1D',
    title: 'CEO / Executivo / C-Level / Investidor',
    sub: '11 leads — CEO Holding (3), Executiva C-Level (3), Investidor Silencioso (4), Executivo C-Level (1)',
    leads: '11',
    ticket: 'R$8.000–12.000',
    rows: [
      { label: 'Produto ideal', value: 'Consultoria High Ticket + Acompanhamento anual' },
      { label: 'Conversão esperada', value: '20–30% com abordagem Ron' },
      { label: 'Receita projetada', value: '2–3 fechamentos = R$16k–36k' },
      { label: 'Canal', value: 'LinkedIn DM → call direto com Ron' },
      { label: 'Script', value: 'Sem SDR. Ron aborda diretamente. 1 mensagem cirúrgica, 1 call.', sub: true },
    ],
  },
  {
    badge: 'TIER 2 — segunda semana',
    badgeVariant: 'warning',
    accent: '#BA7517',
    title: 'Atleta Premium Ironman + Biohacker',
    sub: '107 leads — Atleta Premium (100), Biohacker (7)',
    leads: '107',
    ticket: 'R$2.000–5.000',
    rows: [
      { label: 'Produto ideal', value: 'Protocolo 9FIT PRO + acompanhamento 3 meses' },
      { label: 'Conversão esperada', value: '5–10% (SDR qualifica, Ron fecha)' },
      { label: 'Receita projetada', value: '5–10 fechamentos = R$10k–50k' },
      { label: 'Canal', value: 'LinkedIn DM (95 têm LinkedIn)' },
      { label: 'Ângulo', value: '"Engenharia adaptativa: seu treino muda sozinho conforme sua performance."', sub: true },
    ],
  },
  {
    badge: 'TIER 3 — terceira semana',
    badgeVariant: 'info',
    accent: '#185FA5',
    title: 'FitPro frustrado (planilha/PDF)',
    sub: '95 leads — 6 perfis de personal já classificados',
    leads: '95',
    ticket: 'R$397–1.500',
    rows: [
      { label: 'Produto ideal', value: '9FIT PRO mensal + FitManager + White Label' },
      { label: 'Conversão esperada', value: '8–15% (dor clara e produto cirúrgico)' },
      { label: 'Receita projetada', value: '8–14 clientes = R$3,2k–21k/mês' },
      { label: 'Canal', value: 'Instagram DM (todos têm IG)' },
      { label: 'Executor', value: 'Ian + Rafael — SDR fecha direto. Volume alto.', sub: true },
    ],
  },
  {
    badge: 'TIER 4 — paralelo',
    badgeVariant: 'success',
    accent: '#3B6D11',
    title: 'Mães HT + Dor Crônica + Sênior Longevidade',
    sub: '37 leads — Mães (10), Dor Crônica (14), Sênior (8), outros (5)',
    leads: '37',
    ticket: 'R$1.500–4.000',
    rows: [
      { label: 'Produto ideal', value: 'Protocolo clínico + acompanhamento' },
      { label: 'Conversão esperada', value: '15–25% (dor emocional forte)' },
      { label: 'Receita projetada', value: '5–9 fechamentos = R$7,5k–36k' },
      { label: 'Canal', value: 'Instagram DM — abordagem empática, Sara qualifica' },
    ],
  },
];

const FUNNEL = [
  { label: '250 leads abordados', value: '250', pct: 100 },
  { label: 'Respostas/engajamento (25%)', value: '~62', pct: 75 },
  { label: 'Qualificados por Sara/SDR (40%)', value: '~25', pct: 50 },
  { label: 'Calls com Ron — Tier 1+2 (60%)', value: '~15', pct: 30 },
  { label: 'Fechamentos (35% dos calls)', value: '~5–8', pct: 16 },
];

const LTV = [
  { label: 'Entrada', value: 'Protocolo 30 dias — R$1.500' },
  { label: 'Upsell M2', value: '9FIT PRO mensal — R$397/mês' },
  { label: 'Upsell M3', value: 'Acompanhamento trimestral — R$2.500' },
  { label: 'Upsell M6', value: 'Plano anual / consultoria — R$5.000' },
  { label: 'LTV 12 meses', value: 'R$14.264 por cliente ativo', highlight: true },
];

const badgeCls: Record<string, string> = {
  destructive: 'bg-destructive/15 text-destructive border-destructive/30',
  warning: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  info: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  success: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
};

export function LeadsExtractionPlan() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Plano CFO — Extração de Receita</h1>
        <p className="text-sm text-muted-foreground">
          250 leads inexplorados · Potencial real R$27k–68k em 30 dias · CAC = R$0
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { lbl: 'Leads ativos', val: '250', sub: '100% inexplorados' },
          { lbl: 'Potencial mínimo', val: 'R$19k', sub: 'cenário conservador' },
          { lbl: 'Potencial real', val: 'R$68k', sub: 'mix otimizado' },
          { lbl: 'Custo de aquisição', val: 'R$0', sub: 'ROI infinito' },
        ].map((m) => (
          <Card key={m.lbl} className="bg-card/60 border-border/40">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase text-muted-foreground tracking-wide">{m.lbl}</p>
              <p className="text-2xl font-semibold">{m.val}</p>
              <p className="text-[11px] text-muted-foreground">{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Segmentação por valor — prioridade de ataque
        </h2>
        <div className="space-y-3">
          {TIERS.map((t) => (
            <Card key={t.title} className="bg-card/60 border-border/40 border-l-4" style={{ borderLeftColor: t.accent }}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                  <div>
                    <Badge variant="outline" className={badgeCls[t.badgeVariant]}>{t.badge}</Badge>
                    <p className="font-semibold mt-2">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.sub}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold">{t.ticket}</p>
                    <p className="text-xs text-muted-foreground">ticket por cliente</p>
                  </div>
                </div>
                <div className="divide-y divide-border/30">
                  {t.rows.map((r) => (
                    <div key={r.label} className="flex justify-between gap-3 py-2 text-sm">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className={r.sub ? 'text-muted-foreground text-xs text-right max-w-[60%]' : 'font-medium text-right max-w-[60%]'}>
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Funil financeiro — projeção 30 dias
        </h2>
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-5 space-y-4">
            {FUNNEL.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${f.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Estratégia de maximização de LTV
        </h2>
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-5 divide-y divide-border/30">
            {LTV.map((r) => (
              <div key={r.label} className="flex justify-between py-2 text-sm">
                <span className="font-medium">{r.label}</span>
                <span className={r.highlight ? 'text-emerald-500 font-semibold' : ''}>{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="bg-emerald-500/10 border-emerald-500/40">
          <CardContent className="p-5 flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="text-emerald-500 font-medium text-sm">Receita total projetada — 30 dias</p>
              <p className="text-xs text-emerald-500/80">5 fechamentos mix Tier 1–4, sem contar recorrência</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-500">R$27k–68k</p>
              <p className="text-xs text-emerald-500/80">custo de aquisição: R$0</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Execução — quem faz o quê</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Crown, name: 'Ron', desc: 'Aborda Tier 1 direto (11 leads). Fecha calls quentes. Não toca Tier 3.', accent: 'text-destructive' },
            { icon: Phone, name: 'Ian + Rafael', desc: 'Ativam Tier 2–3 (202 leads). 10 leads/dia cada. Cadência 5 toques.', accent: 'text-amber-500' },
            { icon: ClipboardCheck, name: 'Sara', desc: 'Qualifica Mães + Dor Crônica (Tier 4). Empática. Envia quentes p/ Ron.', accent: 'text-blue-500' },
          ].map((p) => {
            const I = p.icon;
            return (
              <Card key={p.name} className="bg-card/60 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <I className={`w-4 h-4 ${p.accent}`} />
                    <span className="font-medium text-sm">{p.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="border-border/40 bg-card/40">
        <CardContent className="p-4 text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Regra CFO:</strong> Tier 1 vale mais que os outros 3 tiers somados em ticket.
          Cada hora do founder em lead de R$397 é uma consultoria de R$8k que não aconteceu.
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate('/agents')} className="gap-2">
          Gerar Script Tier 1 no Hub <ArrowRight className="w-4 h-4" />
        </Button>
        <Button onClick={() => navigate('/agents')} variant="outline" className="gap-2">
          Cadência SDR Ironman <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default LeadsExtractionPlan;
