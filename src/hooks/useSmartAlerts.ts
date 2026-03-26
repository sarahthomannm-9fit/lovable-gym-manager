import { useMemo } from 'react';
import { CrossMetrics } from './useCrossMetrics';

export interface SmartAlert {
  id: string;
  tipo: 'urgente' | 'atencao' | 'oportunidade' | 'info';
  coluna: 'critico' | 'decisao' | 'sistema';
  titulo: string;
  descricao: string;
  acao: string;
  rota: string;
  quantidade?: number;
  valor?: number;
}

export function useSmartAlerts(metrics: CrossMetrics | undefined): SmartAlert[] {
  return useMemo(() => {
    if (!metrics) return [];
    const alerts: SmartAlert[] = [];

    // === COLUNA CRÍTICA (esquerda) — o que quebra se não agir ===

    if (metrics.totalInadimplente > 0) {
      alerts.push({
        id: 'inadimplencia',
        tipo: metrics.totalInadimplente > 1000 ? 'urgente' : 'atencao',
        coluna: 'critico',
        titulo: `R$ ${metrics.totalInadimplente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em cobranças vencidas`,
        descricao: `${metrics.inadimplencia} pagamento(s) pendente(s) com vencimento ultrapassado`,
        acao: 'Ver cobranças',
        rota: '/pagamentos',
        quantidade: metrics.inadimplencia,
        valor: metrics.totalInadimplente,
      });
    }

    if (metrics.alunosInativos > 0) {
      alerts.push({
        id: 'inativos',
        tipo: metrics.alunosInativos > 5 ? 'urgente' : 'atencao',
        coluna: 'critico',
        titulo: `${metrics.alunosInativos} aluno(s) sem frequência`,
        descricao: 'Sem check-in nos últimos 15 dias. Risco de churn.',
        acao: 'Ver alunos',
        rota: '/alunos',
        quantidade: metrics.alunosInativos,
      });
    }

    // Churn risk alto
    const churnAlto = metrics.churnRisk.filter(c => c.motivos.length >= 2);
    if (churnAlto.length > 0) {
      alerts.push({
        id: 'churn-alto',
        tipo: 'urgente',
        coluna: 'critico',
        titulo: `${churnAlto.length} aluno(s) com alto risco de saída`,
        descricao: `Inatividade + inadimplência: ${churnAlto.slice(0, 3).map(c => c.nome).join(', ')}${churnAlto.length > 3 ? '...' : ''}`,
        acao: 'Tomar ação',
        rota: '/alunos',
        quantidade: churnAlto.length,
      });
    }

    // Aulas sem instrutor
    if (metrics.aulasSemInstrutor > 0) {
      alerts.push({
        id: 'aula-sem-instrutor',
        tipo: 'urgente',
        coluna: 'critico',
        titulo: `${metrics.aulasSemInstrutor} aula(s) sem instrutor`,
        descricao: 'Aulas de hoje/amanhã sem professor confirmado',
        acao: 'Resolver agenda',
        rota: '/aulas',
        quantidade: metrics.aulasSemInstrutor,
      });
    }

    // Crescimento negativo
    if (metrics.crescimentoReceita < -5) {
      alerts.push({
        id: 'queda-receita',
        tipo: 'urgente',
        coluna: 'critico',
        titulo: `Receita caiu ${Math.abs(metrics.crescimentoReceita).toFixed(1)}%`,
        descricao: `De R$ ${metrics.receitaAnterior.toLocaleString('pt-BR')} para R$ ${metrics.receitaMensal.toLocaleString('pt-BR')}`,
        acao: 'Ver relatórios',
        rota: '/relatorios',
      });
    }

    // === COLUNA DECISÃO (centro) — o que decide o mês ===

    if (metrics.alunosComTreinoVencido > 0) {
      alerts.push({
        id: 'treinos-vencidos',
        tipo: 'atencao',
        coluna: 'decisao',
        titulo: `${metrics.alunosComTreinoVencido} treino(s) vencido(s)`,
        descricao: 'Alunos precisam de novo plano de treino',
        acao: 'Ver treinos',
        rota: '/treinos',
        quantidade: metrics.alunosComTreinoVencido,
      });
    }

    if (metrics.alunosComAvaliacaoPendente > 0) {
      alerts.push({
        id: 'avaliacoes-pendentes',
        tipo: 'atencao',
        coluna: 'decisao',
        titulo: `${metrics.alunosComAvaliacaoPendente} avaliação(ões) pendente(s)`,
        descricao: 'Avaliações com data de retorno ultrapassada',
        acao: 'Ver avaliações',
        rota: '/avaliacoes',
        quantidade: metrics.alunosComAvaliacaoPendente,
      });
    }

    if (metrics.taxaRetencao < 80 && metrics.totalAlunos > 0) {
      alerts.push({
        id: 'retencao-baixa',
        tipo: 'atencao',
        coluna: 'decisao',
        titulo: `Retenção em ${metrics.taxaRetencao.toFixed(0)}%`,
        descricao: 'Abaixo da meta de 80%. Considere programa de fidelidade.',
        acao: 'Ver campanhas',
        rota: '/marketing/campanhas',
      });
    }

    if (metrics.experimentaisAgendadas > 0) {
      alerts.push({
        id: 'experimentais-pendentes',
        tipo: 'oportunidade',
        coluna: 'decisao',
        titulo: `${metrics.experimentaisAgendadas} aula(s) experimental(is)`,
        descricao: `Taxa de conversão: ${metrics.taxaConversaoExperimental.toFixed(0)}%`,
        acao: 'Ver experimentais',
        rota: '/experimentais',
        quantidade: metrics.experimentaisAgendadas,
      });
    }

    // Assinaturas vencendo
    if (metrics.assinaturasVencendo > 0) {
      alerts.push({
        id: 'assinaturas-vencendo',
        tipo: 'atencao',
        coluna: 'decisao',
        titulo: `${metrics.assinaturasVencendo} assinatura(s) vencendo`,
        descricao: 'Vencimento nos próximos 7 dias',
        acao: 'Ver assinaturas',
        rota: '/pagamentos',
        quantidade: metrics.assinaturasVencendo,
      });
    }

    // Leads sem follow-up
    if (metrics.leadsSemFollowup > 0) {
      alerts.push({
        id: 'leads-sem-followup',
        tipo: 'atencao',
        coluna: 'decisao',
        titulo: `${metrics.leadsSemFollowup} lead(s) sem follow-up`,
        descricao: 'Captados há 24h+ sem interação',
        acao: 'Entrar em contato',
        rota: '/marketing/captacao',
        quantidade: metrics.leadsSemFollowup,
      });
    }

    // === COLUNA SISTEMA (direita) — o que o sistema faz sozinho ===

    if (metrics.cobrancasProximas && metrics.cobrancasProximas > 0) {
      alerts.push({
        id: 'cobrancas-proximas',
        tipo: 'info',
        coluna: 'sistema',
        titulo: `${metrics.cobrancasProximas} cobrança(s) nos próximos 2 dias`,
        descricao: 'Alunos com dia de pagamento se aproximando',
        acao: 'Ver alunos',
        rota: '/alunos',
        quantidade: metrics.cobrancasProximas,
      });
    }

    if (metrics.aulasHoje > 0) {
      alerts.push({
        id: 'aulas-hoje',
        tipo: 'info',
        coluna: 'sistema',
        titulo: `${metrics.aulasHoje} aula(s) programada(s) para hoje`,
        descricao: `Ocupação média: ${metrics.ocupacaoMedia.toFixed(0)}%`,
        acao: 'Ver aulas',
        rota: '/aulas',
        quantidade: metrics.aulasHoje,
      });
    }

    return alerts.sort((a, b) => {
      const prioridade = { urgente: 0, atencao: 1, oportunidade: 2, info: 3 };
      return prioridade[a.tipo] - prioridade[b.tipo];
    });
  }, [metrics]);
}
