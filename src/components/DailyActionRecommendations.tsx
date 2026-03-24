import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useNavigate } from 'react-router-dom';
import {
  Zap, DollarSign, Users, MessageSquare, Dumbbell,
  CalendarCheck, TrendingUp, UserPlus, AlertTriangle,
  Star, Clock, Target, Heart, RefreshCw, Megaphone,
  Sparkles
} from 'lucide-react';

interface DailyAction {
  id: string;
  categoria: 'caixa' | 'conteudo' | 'gestao';
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  impacto: string;
  rota: string;
  icon: any;
  metrica?: string;
}

export function DailyActionRecommendations() {
  const navigate = useNavigate();
  const { metrics, alerts, alunos, campanhas } = useDataIntegration();

  const actions = useMemo<DailyAction[]>(() => {
    if (!metrics) return [];
    const list: DailyAction[] = [];
    const hoje = new Date();
    const diaSemana = hoje.getDay();

    // ═══ CAIXA (Revenue) ═══

    // Cobranças vencidas — ação prioritária
    if (metrics.totalInadimplente > 0) {
      list.push({
        id: 'cobrar-inadimplentes',
        categoria: 'caixa',
        prioridade: metrics.totalInadimplente > 500 ? 'alta' : 'media',
        titulo: `Cobrar ${metrics.inadimplencia} pagamento(s) vencido(s)`,
        descricao: `R$ ${metrics.totalInadimplente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto. Envie lembretes hoje.`,
        impacto: `+R$ ${metrics.totalInadimplente.toLocaleString('pt-BR')} potencial`,
        rota: '/pagamentos',
        icon: DollarSign,
        metrica: `${metrics.inadimplencia} vencido(s)`,
      });
    }

    // Cobranças próximas — prevenir inadimplência
    if (metrics.cobrancasProximas > 0) {
      list.push({
        id: 'prevenir-inadimplencia',
        categoria: 'caixa',
        prioridade: 'media',
        titulo: `Lembrar ${metrics.cobrancasProximas} aluno(s) sobre pagamento`,
        descricao: 'Pagamentos vencem nos próximos 2 dias. Envie lembrete preventivo.',
        impacto: 'Prevenir inadimplência',
        rota: '/alunos',
        icon: Clock,
      });
    }

    // Experimentais agendadas — converter em receita
    if (metrics.experimentaisAgendadas > 0) {
      list.push({
        id: 'converter-experimentais',
        categoria: 'caixa',
        prioridade: 'alta',
        titulo: `Converter ${metrics.experimentaisAgendadas} aula(s) experimental(is)`,
        descricao: `Taxa de conversão atual: ${metrics.taxaConversaoExperimental.toFixed(0)}%. Prepare a oferta de matrícula.`,
        impacto: `+${metrics.experimentaisAgendadas} alunos potenciais`,
        rota: '/experimentais',
        icon: UserPlus,
        metrica: `${metrics.taxaConversaoExperimental.toFixed(0)}% conversão`,
      });
    }

    // Receita caindo — ação urgente
    if (metrics.crescimentoReceita < -5) {
      list.push({
        id: 'reverter-queda-receita',
        categoria: 'caixa',
        prioridade: 'alta',
        titulo: 'Criar campanha de reativação',
        descricao: `Receita caiu ${Math.abs(metrics.crescimentoReceita).toFixed(1)}%. Lance promoção para ex-alunos ou inativos.`,
        impacto: 'Reverter tendência negativa',
        rota: '/marketing/campanhas',
        icon: TrendingUp,
      });
    }

    // Leads sem follow-up
    if (metrics.leadsTotal > metrics.leadsConvertidos && metrics.leadsTotal > 0) {
      const leadsPendentes = metrics.leadsTotal - metrics.leadsConvertidos;
      list.push({
        id: 'follow-up-leads',
        categoria: 'caixa',
        prioridade: leadsPendentes > 5 ? 'alta' : 'media',
        titulo: `Fazer follow-up em ${leadsPendentes} lead(s)`,
        descricao: 'Leads aguardando contato. Cada follow-up aumenta chance de conversão em 40%.',
        impacto: `${leadsPendentes} oportunidades`,
        rota: '/marketing/captacao',
        icon: Target,
      });
    }

    // ═══ GESTÃO ═══

    // Alunos inativos — risco de churn
    if (metrics.alunosInativos > 0) {
      list.push({
        id: 'reativar-inativos',
        categoria: 'gestao',
        prioridade: metrics.alunosInativos > 3 ? 'alta' : 'media',
        titulo: `Contatar ${metrics.alunosInativos} aluno(s) sem frequência`,
        descricao: 'Sem check-in há 15+ dias. Ligue ou envie mensagem personalizada.',
        impacto: `Evitar ${metrics.alunosInativos} cancelamento(s)`,
        rota: '/alunos',
        icon: Heart,
        metrica: `${metrics.alunosInativos} em risco`,
      });
    }

    // Treinos vencidos
    if (metrics.alunosComTreinoVencido > 0) {
      list.push({
        id: 'atualizar-treinos',
        categoria: 'gestao',
        prioridade: 'media',
        titulo: `Renovar ${metrics.alunosComTreinoVencido} treino(s) vencido(s)`,
        descricao: 'Alunos com plano de treino expirado. Agende atualização hoje.',
        impacto: 'Melhora satisfação e retenção',
        rota: '/treinos',
        icon: Dumbbell,
      });
    }

    // Avaliações pendentes
    if (metrics.alunosComAvaliacaoPendente > 0) {
      list.push({
        id: 'agendar-avaliacoes',
        categoria: 'gestao',
        prioridade: 'media',
        titulo: `Agendar ${metrics.alunosComAvaliacaoPendente} avaliação(ões)`,
        descricao: 'Avaliações físicas com retorno pendente. Contate os alunos.',
        impacto: 'Engajamento + upsell',
        rota: '/avaliacoes',
        icon: CalendarCheck,
      });
    }

    // Aulas hoje
    if (metrics.aulasHoje > 0) {
      list.push({
        id: 'preparar-aulas',
        categoria: 'gestao',
        prioridade: 'baixa',
        titulo: `Preparar ${metrics.aulasHoje} aula(s) de hoje`,
        descricao: `Ocupação média: ${metrics.ocupacaoMedia.toFixed(0)}%. Confirme presenças e materiais.`,
        impacto: 'Operação organizada',
        rota: '/aulas',
        icon: CalendarCheck,
        metrica: `${metrics.ocupacaoMedia.toFixed(0)}% ocupação`,
      });
    }

    // Churn risk alto
    const churnAlto = metrics.churnRisk.filter(c => c.motivos.length >= 2);
    if (churnAlto.length > 0) {
      list.push({
        id: 'prevenir-churn',
        categoria: 'gestao',
        prioridade: 'alta',
        titulo: `Ação urgente: ${churnAlto.length} aluno(s) com alto risco`,
        descricao: `${churnAlto.slice(0, 3).map(c => c.nome).join(', ')} — múltiplos sinais de saída.`,
        impacto: 'Retenção crítica',
        rota: '/alunos',
        icon: AlertTriangle,
      });
    }

    // Retenção baixa
    if (metrics.taxaRetencao < 80 && metrics.totalAlunos > 0) {
      list.push({
        id: 'programa-fidelidade',
        categoria: 'gestao',
        prioridade: 'media',
        titulo: 'Criar programa de fidelidade',
        descricao: `Retenção em ${metrics.taxaRetencao.toFixed(0)}% (meta: 80%). Implemente benefícios para alunos fiéis.`,
        impacto: 'Aumentar retenção',
        rota: '/marketing/campanhas',
        icon: Star,
      });
    }

    // ═══ CONTEÚDO / MARKETING ═══

    // Segunda-feira = planejamento de conteúdo
    if (diaSemana === 1) {
      list.push({
        id: 'planejar-semana',
        categoria: 'conteudo',
        prioridade: 'media',
        titulo: 'Planejar conteúdo da semana',
        descricao: 'Segunda é dia de planejar posts, stories e comunicações da semana.',
        impacto: 'Consistência de marca',
        rota: '/marketing/comunicacao',
        icon: MessageSquare,
      });
    }

    // Campanhas ativas sem resultado
    const campanhasSemResultado = campanhas.filter(c => c.status === 'ativa' && (!c.conversoes || c.conversoes === 0));
    if (campanhasSemResultado.length > 0) {
      list.push({
        id: 'otimizar-campanhas',
        categoria: 'conteudo',
        prioridade: 'media',
        titulo: `Otimizar ${campanhasSemResultado.length} campanha(s) sem conversão`,
        descricao: 'Campanhas ativas sem resultado. Revise copy, segmentação e CTA.',
        impacto: 'Melhorar ROI',
        rota: '/marketing/campanhas',
        icon: Megaphone,
      });
    }

    // Sugerir campanha se nenhuma ativa
    const campanhasAtivas = campanhas.filter(c => c.status === 'ativa');
    if (campanhasAtivas.length === 0) {
      list.push({
        id: 'criar-campanha',
        categoria: 'conteudo',
        prioridade: 'media',
        titulo: 'Criar campanha de captação',
        descricao: 'Nenhuma campanha ativa. Lance uma campanha para atrair novos alunos.',
        impacto: 'Geração de leads',
        rota: '/marketing/captacao',
        icon: Megaphone,
      });
    }

    // Sexta = preparar conteúdo do fim de semana
    if (diaSemana === 5) {
      list.push({
        id: 'conteudo-fds',
        categoria: 'conteudo',
        prioridade: 'baixa',
        titulo: 'Preparar comunicação do fim de semana',
        descricao: 'Envie dicas de treino, nutrição ou motivação para engajar no fim de semana.',
        impacto: 'Engajamento contínuo',
        rota: '/marketing/comunicacao',
        icon: MessageSquare,
      });
    }

    // Se poucos alunos, focar em crescimento
    if (metrics.totalAlunos < 20) {
      list.push({
        id: 'crescer-base',
        categoria: 'conteudo',
        prioridade: 'alta',
        titulo: 'Lançar campanha de indicação',
        descricao: 'Base pequena. Ofereça benefícios para alunos que indicarem amigos.',
        impacto: 'Crescimento orgânico',
        rota: '/marketing/promocoes',
        icon: Users,
      });
    }

    // Sort by priority
    const prioridadeOrdem = { alta: 0, media: 1, baixa: 2 };
    return list.sort((a, b) => prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade]);
  }, [metrics, alerts, alunos, campanhas]);

  if (actions.length === 0) return null;

  const categorias = {
    caixa: { label: '💰 Gerar Caixa', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800' },
    gestao: { label: '⚙️ Gestão', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
    conteudo: { label: '📣 Conteúdo & Marketing', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800' },
  };

  const prioridadeBadge = {
    alta: 'destructive' as const,
    media: 'default' as const,
    baixa: 'secondary' as const,
  };

  const grouped = {
    caixa: actions.filter(a => a.categoria === 'caixa'),
    gestao: actions.filter(a => a.categoria === 'gestao'),
    conteudo: actions.filter(a => a.categoria === 'conteudo'),
  };

  const hojeFormatado = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Ações Recomendadas para Hoje</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">{hojeFormatado} — {actions.length} ações prioritárias</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {actions.filter(a => a.prioridade === 'alta').length} urgentes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(['caixa', 'gestao', 'conteudo'] as const).map(cat => {
          const items = grouped[cat];
          if (items.length === 0) return null;
          const config = categorias[cat];

          return (
            <div key={cat} className={`rounded-lg border ${config.border} ${config.bg} p-3 space-y-2`}>
              <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
              <div className="space-y-2">
                {items.map(action => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.id}
                      className="flex items-start gap-3 p-2.5 rounded-md bg-background/80 hover:bg-background cursor-pointer transition-colors group"
                      onClick={() => navigate(action.rota)}
                    >
                      <div className="mt-0.5 shrink-0">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{action.titulo}</span>
                          <Badge variant={prioridadeBadge[action.prioridade]} className="text-[10px] h-4 px-1.5">
                            {action.prioridade}
                          </Badge>
                          {action.metrica && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{action.metrica}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.descricao}</p>
                        <p className="text-xs font-medium text-primary mt-1">⚡ {action.impacto}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        onClick={(e) => { e.stopPropagation(); navigate(action.rota); }}
                      >
                        Agir →
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
