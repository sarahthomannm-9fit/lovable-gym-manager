import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Send,
  AlertCircle,
  Flag,
  CheckCircle2,
  Info,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

// ============================================
// AGENT CONFIG
// ============================================
type AgentId = 'ron' | 'sdr' | 'prep' | 'reativacao' | 'upsell' | 'b2b' | 'onboard' | 'billing' | 'content' | 'suporte';
type AgentStatus = 'on' | 'idle';
type AgentGroup = 'core' | 'receita' | 'operacao' | 'marketing';

interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  group: AgentGroup;
  description: string;
  color: string;
  bg: string;
  status: AgentStatus;
  triggers: string[];
  actions: string[];
  escalation: string;
  table: string;
  fields: string;
}

const AGENTS: AgentDef[] = [
  {
    id: 'ron',
    name: 'RON Core',
    role: 'COO',
    group: 'core',
    description: 'Orquestrador master. Recebe seus comandos e distribui para os agentes certos.',
    color: '#1F2937',
    bg: '#E5E7EB',
    status: 'on',
    triggers: ['comando direto do CEO', 'falha em qualquer agente (retry)', 'briefing diário 07h'],
    actions: [
      'Recebe input do CEO em linguagem natural',
      'Decide qual agente acionar e com quais parâmetros',
      'Monitora execução e aplica retry/fallback',
      'Loga toda execução em agent_logs',
      'Devolve plano de ação em até 5 bullets',
    ],
    escalation: 'Quando dois ou mais agentes falham na mesma cadeia.',
    table: 'agent_logs',
    fields: 'id, agent_id, triggered_by, input, output, status, latency_ms, created_at',
  },
  {
    id: 'sdr',
    name: 'SDR Agent',
    role: 'Vendas',
    group: 'receita',
    description: 'Prospecta leads no Instagram, qualifica e organiza follow-ups.',
    color: '#0F6E56',
    bg: '#E1F5EE',
    status: 'on',
    triggers: ['novo lead com status novo', 'comando do CEO', 'varredura diária 09h leads inativos +24h'],
    actions: [
      'Lê perfil do lead no Supabase',
      'Gera mensagem personalizada (dor + prova + pergunta)',
      'Atualiza status para contatado',
      'Agenda follow-up em 48h',
      'Quando qualifica, notifica CEO no briefing',
      'CEO fecha, SDR registra conversão',
    ],
    escalation: 'Leads com interesse em plano acima de R$697 ou que não respondem em 3 tentativas.',
    table: 'leads',
    fields: 'id, nome, email, telefone, status, score, fonte, observacoes, created_at',
  },
  {
    id: 'prep',
    name: 'Prep de Call',
    role: 'Vendas',
    group: 'receita',
    description: 'Briefing de 5 linhas antes de cada call do CEO.',
    color: '#5B21B6',
    bg: '#EDE9FE',
    status: 'on',
    triggers: ['call agendada nas próximas 2h', 'comando do CEO informando o lead'],
    actions: [
      'Puxa histórico do lead no Supabase',
      'Identifica origem, dor e tentativas anteriores',
      'Antecipa objeção mais provável',
      'Sugere produto/plano ideal',
      'Devolve estratégia de fechamento em 1 linha',
    ],
    escalation: 'Lead sem histórico nenhum no banco.',
    table: 'leads',
    fields: 'id, nome, fonte, status, observacoes, score',
  },
  {
    id: 'reativacao',
    name: 'Reativação Agent',
    role: 'Vendas',
    group: 'receita',
    description: 'Recupera ex-alunos inativos (30, 60, 90+ dias).',
    color: '#B45309',
    bg: '#FEF3C7',
    status: 'on',
    triggers: ['varredura semanal de inativos', 'comando do CEO ("reativar base 90d")'],
    actions: [
      'Segmenta ex-alunos por tempo inativo',
      'Identifica último plano e perfil',
      'Gera mensagem curta personalizada',
      'CTA claro (volta com desconto, prova social, urgência)',
      'Marca tentativa e mede resposta',
    ],
    escalation: 'Aluno responde com reclamação formal ou pedido de cancelamento definitivo.',
    table: 'alunos',
    fields: 'id, nome, status, lifecycle_status, plano_id, data_matricula',
  },
  {
    id: 'upsell',
    name: 'Upsell Agent',
    role: 'Vendas',
    group: 'receita',
    description: 'Detecta gaps no plano atual e sugere upgrade.',
    color: '#0E7490',
    bg: '#CFFAFE',
    status: 'on',
    triggers: ['aluno com 60+ dias ativo', 'comando do CEO', 'aluno completa primeira avaliação'],
    actions: [
      'Analisa plano atual + serviços usados',
      'Detecta gap (ex: usa treino, não usa avaliação)',
      'Calcula valor adicional do upgrade',
      'Gera oferta personalizada',
      'Reporta conversão para CEO',
    ],
    escalation: 'Aluno com pagamento pendente ou em cancelamento.',
    table: 'alunos',
    fields: 'id, nome, plano_id, valor_mensalidade, lifecycle_status',
  },
  {
    id: 'b2b',
    name: 'Proposta B2B',
    role: 'Vendas',
    group: 'receita',
    description: 'Gera proposta HTML para empresas em 6 blocos estruturados.',
    color: '#9F1239',
    bg: '#FFE4E6',
    status: 'on',
    triggers: ['comando do CEO com dados da empresa'],
    actions: [
      'Recebe nome da empresa, serviços e valor',
      'Gera Headline + Problema + Solução',
      'Lista entregáveis e CTA',
      'Salva HTML em propostas_b2b status draft',
      'CEO aprova e envia',
    ],
    escalation: 'Empresa com mais de 500 colaboradores ou contrato acima de R$50k.',
    table: 'propostas_b2b',
    fields: 'id, empresa, contato, valor, html, status',
  },
  {
    id: 'onboard',
    name: 'Onboarding Agent',
    role: 'Alunos',
    group: 'operacao',
    description: 'Acompanha novos alunos nos primeiros 30 dias.',
    color: '#185FA5',
    bg: '#E6F1FB',
    status: 'on',
    triggers: ['novo aluno cadastrado', 'varredura diária 08h alunos dia 1–30', 'comando do CEO'],
    actions: [
      'Dia 1: boas-vindas + link anamnese',
      'Dia 3: verifica preenchimento',
      'Dia 7: relatório primeira semana',
      'Dia 14: check-in de metas',
      'Dia 30: finaliza onboarding + NPS',
      'Sem acesso por 72h: reengajamento',
    ],
    escalation: 'Aluno relata lesão, dor intensa ou problema de saúde.',
    table: 'alunos',
    fields: 'id, nome, email, status, lifecycle_status, plano_id, data_matricula',
  },
  {
    id: 'billing',
    name: 'Billing Agent',
    role: 'Financeiro',
    group: 'operacao',
    description: 'Monitora cobranças e aplica régua de inadimplência.',
    color: '#854F0B',
    bg: '#FAEEDA',
    status: 'on',
    triggers: ['pagamento vencido', 'varredura diária 07h vencimentos', 'comando do CEO'],
    actions: [
      'Vencimento: marca em atraso + lembrete cordial',
      '+3 dias: segundo lembrete + link de pagamento',
      '+7 dias: aviso de suspensão',
      '+15 dias: escala para CEO',
      'Pagamento confirmado: atualiza status + registra data',
      'Gera projeção mensal no briefing',
    ],
    escalation: 'Inadimplência acima de 15 dias ou valor acima de R$500.',
    table: 'pagamentos',
    fields: 'id, aluno_id, valor, status, data_vencimento, data_pagamento, metodo_pagamento',
  },
  {
    id: 'suporte',
    name: 'Suporte Agent',
    role: 'Atendimento',
    group: 'operacao',
    description: 'Responde dúvidas de alunos sobre treinos, planos, pagamentos e app.',
    color: '#3B6D11',
    bg: '#EAF3DE',
    status: 'on',
    triggers: ['novo ticket aberto', 'mensagem de aluno no app', 'comando do CEO'],
    actions: [
      'Classifica ticket: técnico, financeiro, treino ou reclamação',
      'Técnico: responde automaticamente',
      'Financeiro: responde + conecta Billing Agent',
      'Treino: orienta + sugere 9FIT PRO',
      'Reclamação: empatia + escala CEO',
      'Calcula NPS semanal para briefing',
    ],
    escalation: 'Reclamações formais, menção a cancelamento ou risco legal.',
    table: 'support_tickets',
    fields: 'id, aluno_id, message, category, status, agent_response, escalated_to_ceo',
  },
  {
    id: 'content',
    name: 'Content Agent',
    role: 'Marketing',
    group: 'marketing',
    description: 'Produz scripts de Reels, copy de anúncios e posts.',
    color: '#993556',
    bg: '#FBEAF0',
    status: 'idle',
    triggers: ['comando do CEO', 'pauta semanal segunda 08h'],
    actions: [
      'Recebe tema do CEO',
      'Gera script de Reels em 3 partes (gancho + dev + CTA)',
      'Gera copy de anúncio (headline + body + CTA)',
      'Gera legenda com hashtags',
      'Salva em content_drafts status pending_review',
      'Após aprovação: status approved + sugere horário',
    ],
    escalation: 'Conteúdo com promessas médicas ou resultados garantidos.',
    table: 'content_drafts',
    fields: 'id, type, topic, body, status, approved_at, scheduled_at',
  },
];

const GROUP_LABELS: Record<AgentGroup, string> = {
  core: 'cérebro · ron core',
  receita: 'agentes de receita',
  operacao: 'operação',
  marketing: 'marketing',
};

// ============================================
// TYPES
// ============================================
interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  ts: number;
}

interface MetricCard {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  icon: any;
}

// ============================================
// COMPONENT
// ============================================
export default function AgentsHub() {
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('sdr');
  const [chats, setChats] = useState<Record<AgentId, ChatMessage[]>>({
    sdr: [], onboard: [], billing: [], content: [], suporte: [],
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [briefing, setBriefing] = useState<Array<{ kind: 'hot' | 'warn' | 'ok' | 'info'; title: string; subtitle: string }>>([]);
  const [loadingBriefing, setLoadingBriefing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeAgent = useMemo(() => AGENTS.find((a) => a.id === activeAgentId)!, [activeAgentId]);

  // ---- Load metrics + briefing
  useEffect(() => {
    loadMetrics();
  }, []);

  // ---- Auto-greeting when switching agent
  useEffect(() => {
    if (chats[activeAgentId].length === 0) {
      const hello: Record<AgentId, string> = {
        sdr: 'Olá Rony. Pronto para prospectar. Qual lead vamos trabalhar?',
        onboard: 'Oi Rony! Tudo certo no onboarding. Algum aluno específico?',
        billing: 'Olá Rony. Régua financeira em dia. O que precisa?',
        content: 'Oi Rony, qual tema vamos rodar hoje?',
        suporte: 'Olá Rony. Sem tickets críticos no momento.',
      };
      setChats((prev) => ({
        ...prev,
        [activeAgentId]: [{ role: 'agent', content: hello[activeAgentId], ts: Date.now() }],
      }));
    }
  }, [activeAgentId]);

  // ---- Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chats, activeAgentId, sending]);

  async function loadMetrics() {
    setLoadingBriefing(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().slice(0, 10);

      const [leadsRes, alunosRes, pagosRes, inadRes, ticketsRes] = await Promise.all([
        supabase.from('leads').select('id, created_at', { count: 'exact', head: false }),
        supabase.from('alunos').select('id, status').eq('status', 'ativo'),
        supabase.from('pagamentos').select('valor, status, data_pagamento').eq('status', 'pago').gte('data_pagamento', monthStartStr),
        supabase.from('pagamentos').select('id, status, data_vencimento').neq('status', 'pago').lt('data_vencimento', today),
        supabase.from('support_tickets').select('id, status, escalated_to_ceo').eq('status', 'open'),
      ]);

      const leadsHoje = (leadsRes.data || []).filter((l: any) => l.created_at?.startsWith(today)).length;
      const alunosAtivos = alunosRes.data?.length || 0;
      const receitaMes = (pagosRes.data || []).reduce((s: number, p: any) => s + Number(p.valor || 0), 0);
      const inadimplentes = inadRes.data?.length || 0;
      const ticketsAbertos = ticketsRes.data?.length || 0;

      setMetrics([
        { label: 'Leads hoje', value: String(leadsHoje), delta: leadsHoje > 0 ? `+${leadsHoje} novos` : 'sem novos', positive: leadsHoje > 0, icon: TrendingUp },
        { label: 'Alunos ativos', value: String(alunosAtivos), delta: 'base atual', positive: true, icon: Users },
        { label: 'Receita do mês', value: receitaMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), delta: receitaMes > 0 ? 'no azul' : 'sem entradas', positive: receitaMes > 0, icon: DollarSign },
        { label: 'Inadimplentes', value: String(inadimplentes), delta: inadimplentes > 0 ? 'requer ação' : 'em dia', positive: inadimplentes === 0, icon: AlertTriangle },
      ]);

      // Build briefing from real data
      const items: typeof briefing = [];
      if (inadimplentes > 0) items.push({ kind: 'hot', title: `${inadimplentes} pagamentos em atraso`, subtitle: 'Billing Agent ativou régua de cobrança.' });
      if (ticketsAbertos > 0) items.push({ kind: 'warn', title: `${ticketsAbertos} tickets abertos`, subtitle: 'Suporte Agent processando — verifique escalações.' });
      if (leadsHoje > 0) items.push({ kind: 'info', title: `${leadsHoje} novos leads hoje`, subtitle: 'SDR Agent iniciando primeira abordagem.' });
      if (alunosAtivos > 0 && inadimplentes === 0) items.push({ kind: 'ok', title: 'Operação financeira em dia', subtitle: `${alunosAtivos} alunos ativos, todos adimplentes.` });
      if (items.length === 0) items.push({ kind: 'ok', title: 'Tudo tranquilo no painel', subtitle: 'Nenhuma ação crítica pendente. Bom dia para focar em estratégia.' });

      setBriefing(items);
    } catch (err) {
      console.error('loadMetrics error:', err);
      setMetrics([
        { label: 'Leads hoje', value: '—', icon: TrendingUp },
        { label: 'Alunos ativos', value: '—', icon: Users },
        { label: 'Receita do mês', value: '—', icon: DollarSign },
        { label: 'Inadimplentes', value: '—', icon: AlertTriangle },
      ]);
      setBriefing([{ kind: 'info', title: 'Briefing indisponível', subtitle: 'Erro ao carregar dados do Supabase.' }]);
    } finally {
      setLoadingBriefing(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const userMsg: ChatMessage = { role: 'user', content: text, ts: Date.now() };
    setChats((prev) => ({ ...prev, [activeAgentId]: [...prev[activeAgentId], userMsg] }));
    setInput('');
    try {
      const { data, error } = await supabase.functions.invoke('agent-hub-chat', {
        body: {
          agentId: activeAgentId,
          history: chats[activeAgentId],
          message: text,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || 'Erro de conexão com o agente.');
        return;
      }
      const reply: string = data?.reply ?? 'Sem resposta.';
      setChats((prev) => ({
        ...prev,
        [activeAgentId]: [...prev[activeAgentId], { role: 'agent', content: reply, ts: Date.now() }],
      }));
    } catch (err) {
      console.error(err);
      toast.error('Erro ao falar com o agente.');
    } finally {
      setSending(false);
    }
  }

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="bg-card border-b border-border/40 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5A00]" />
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">FitManager — Hub de Agentes IA</h1>
              <p className="text-[11px] text-muted-foreground font-mono tracking-wider">9FIT · ELEVENSOFT · CEO: RONI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> 5 AGENTES ATIVOS
            </Badge>
            <span className="text-xs text-muted-foreground capitalize">{hoje}</span>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Métricas */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            : metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="bg-secondary rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{m.label}</span>
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="font-mono text-2xl font-bold text-foreground">{m.value}</div>
                    {m.delta && (
                      <div className={`text-[10px] mt-1 font-mono ${m.positive ? 'text-emerald-600' : 'text-destructive'}`}>
                        {m.delta}
                      </div>
                    )}
                  </div>
                );
              })}
        </section>

        {/* Cards dos 5 agentes */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {AGENTS.map((a) => {
            const active = a.id === activeAgentId;
            return (
              <button
                key={a.id}
                onClick={() => setActiveAgentId(a.id)}
                className={`text-left p-4 rounded-lg border bg-card transition-all ${
                  active ? 'border-2 shadow-md' : 'border-border/40 hover:border-border'
                }`}
                style={active ? { borderColor: a.color } : undefined}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge style={{ backgroundColor: a.bg, color: a.color }} className="text-[10px] border-0 font-semibold">
                    {a.role}
                  </Badge>
                  <span
                    className={`w-2 h-2 rounded-full ${a.status === 'on' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    title={a.status === 'on' ? 'Ativo' : 'Idle'}
                  />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{a.name}</h3>
                <p className="text-[11px] text-muted-foreground leading-snug">{a.description}</p>
              </button>
            );
          })}
        </section>

        {/* Chat */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${activeAgent.status === 'on' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                />
                <span className="text-sm font-semibold text-foreground">{activeAgent.name}</span>
                <Badge style={{ backgroundColor: activeAgent.bg, color: activeAgent.color }} className="text-[9px] border-0">
                  {activeAgent.role}
                </Badge>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">ENTER PARA ENVIAR</span>
            </div>
            <ScrollArea className="h-[280px]" ref={scrollRef as any}>
              <div className="p-4 space-y-3">
                {chats[activeAgentId].map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        m.role === 'user'
                          ? 'bg-[#E6F1FB] text-[#0C447C]'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border/40 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Comando para ${activeAgent.name}...`}
                disabled={sending}
                className="text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                style={{ backgroundColor: activeAgent.color }}
                className="text-white hover:opacity-90"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> Enviar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Briefing CEO */}
        <section>
          <h2 className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">
            briefing CEO — {new Date().toLocaleDateString('pt-BR')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {loadingBriefing
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
              : briefing.map((it, i) => {
                  const styles = {
                    hot: { bg: '#FAECE7', text: '#712B13', icon: <AlertCircle className="w-4 h-4" /> },
                    warn: { bg: '#FAEEDA', text: '#633806', icon: <Flag className="w-4 h-4" /> },
                    ok: { bg: '#EAF3DE', text: '#27500A', icon: <CheckCircle2 className="w-4 h-4" /> },
                    info: { bg: '#E6F1FB', text: '#0C447C', icon: <Info className="w-4 h-4" /> },
                  }[it.kind];
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-lg flex items-start gap-3"
                      style={{ backgroundColor: styles.bg, color: styles.text }}
                    >
                      <span className="mt-0.5">{styles.icon}</span>
                      <div>
                        <div className="text-sm font-semibold leading-tight">{it.title}</div>
                        <div className="text-[11px] opacity-80 mt-0.5">{it.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </section>

        {/* Documentação dos agentes */}
        <section className="border-t border-border/30 pt-6">
          <h2 className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">
            documentação dos agentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {AGENTS.map((a) => (
              <AccordionItem key={a.id} value={a.id} className="border-border/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="font-semibold text-sm text-foreground">{a.name}</span>
                    <Badge style={{ backgroundColor: a.bg, color: a.color }} className="text-[9px] border-0">
                      {a.role}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pl-4 pt-2">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1.5">
                        O que dispara
                      </div>
                      <ul className="space-y-1">
                        {a.triggers.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: a.color }} />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1.5">
                        O que o agente faz
                      </div>
                      <ol className="space-y-1 list-decimal list-inside">
                        {a.actions.map((act, i) => (
                          <li key={i} className="text-sm text-foreground">{act}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="border-l-4 pl-3 py-1" style={{ borderColor: a.color }}>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5">
                        Quando escala para o CEO
                      </div>
                      <div className="text-sm text-foreground">{a.escalation}</div>
                    </div>
                    <div className="bg-secondary rounded p-3 font-mono text-[11px] text-foreground">
                      <span className="text-muted-foreground">tabela:</span> <strong>{a.table}</strong>
                      <br />
                      <span className="text-muted-foreground">campos:</span> {a.fields}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
}
