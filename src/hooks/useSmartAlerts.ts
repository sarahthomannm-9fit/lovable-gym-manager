import { useMemo } from 'react';
import { CrossMetrics } from './useCrossMetrics';

export interface SmartAlert {
  id: string;
  tipo: 'urgente' | 'atencao' | 'oportunidade' | 'info';
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

    // Inadimplência
    if (metrics.totalInadimplente > 0) {
      alerts.push({
        id: 'inadimplencia',
        tipo: metrics.totalInadimplente > 1000 ? 'urgente' : 'atencao',
        titulo: `R$ ${metrics.totalInadimplente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em cobranças vencidas`,
        descricao: `${metrics.inadimplencia} pagamento(s) pendente(s) com vencimento ultrapassado`,
        acao: 'Ver cobranças',
        rota: '/pagamentos',
        quantidade: metrics.inadimplencia,
        valor: metrics.totalInadimplente,
      });
    }

    // Alunos inativos
    if (metrics.alunosInativos > 0) {
      alerts.push({
        id: 'inativos',
        tipo: metrics.alunosInativos > 5 ? 'urgente' : 'atencao',
        titulo: `${metrics.alunosInativos} aluno(s) sem frequência`,
        descricao: 'Sem check-in nos últimos 15 dias. Risco de churn.',
        acao: 'Ver alunos',
        rota: '/alunos',
        quantidade: metrics.alunosInativos,
      });
    }

    // Treinos vencidos
    if (metrics.alunosComTreinoVencido > 0) {
      alerts.push({
        id: 'treinos-vencidos',
        tipo: 'atencao',
        titulo: `${metrics.alunosComTreinoVencido} treino(s) vencido(s)`,
        descricao: 'Alunos precisam de novo plano de treino',
        acao: 'Ver treinos',
        rota: '/treinos',
        quantidade: metrics.alunosComTreinoVencido,
      });
    }

    // Avaliações pendentes
    if (metrics.alunosComAvaliacaoPendente > 0) {
      alerts.push({
        id: 'avaliacoes-pendentes',
        tipo: 'atencao',
        titulo: `${metrics.alunosComAvaliacaoPendente} avaliação(ões) pendente(s)`,
        descricao: 'Avaliações físicas com data de retorno ultrapassada ou próxima (7 dias)',
        acao: 'Ver avaliações',
        rota: '/avaliacoes',
        quantidade: metrics.alunosComAvaliacaoPendente,
      });
    }

    // Alerta de cobrança 2 dias antes do pagamento
    if (metrics.cobrancasProximas && metrics.cobrancasProximas > 0) {
      alerts.push({
        id: 'cobrancas-proximas',
        tipo: 'info',
        titulo: `${metrics.cobrancasProximas} cobrança(s) nos próximos 2 dias`,
        descricao: 'Alunos com dia de pagamento se aproximando',
        acao: 'Ver alunos',
        rota: '/alunos',
        quantidade: metrics.cobrancasProximas,
      });
    }

    // Churn risk alto
    const churnAlto = metrics.churnRisk.filter(c => c.motivos.length >= 2);
    if (churnAlto.length > 0) {
      alerts.push({
        id: 'churn-alto',
        tipo: 'urgente',
        titulo: `${churnAlto.length} aluno(s) com alto risco de saída`,
        descricao: `Combinação de inatividade + inadimplência: ${churnAlto.slice(0, 3).map(c => c.nome).join(', ')}${churnAlto.length > 3 ? '...' : ''}`,
        acao: 'Tomar ação',
        rota: '/alunos',
        quantidade: churnAlto.length,
      });
    }

    // Crescimento negativo
    if (metrics.crescimentoReceita < -5) {
      alerts.push({
        id: 'queda-receita',
        tipo: 'urgente',
        titulo: `Receita caiu ${Math.abs(metrics.crescimentoReceita).toFixed(1)}%`,
        descricao: `De R$ ${metrics.receitaAnterior.toLocaleString('pt-BR')} para R$ ${metrics.receitaMensal.toLocaleString('pt-BR')}`,
        acao: 'Ver relatórios',
        rota: '/relatorios',
      });
    }

    // Baixa retenção
    if (metrics.taxaRetencao < 80 && metrics.totalAlunos > 0) {
      alerts.push({
        id: 'retencao-baixa',
        tipo: 'atencao',
        titulo: `Taxa de retenção em ${metrics.taxaRetencao.toFixed(0)}%`,
        descricao: 'Abaixo da meta de 80%. Considere programa de fidelidade.',
        acao: 'Ver campanhas',
        rota: '/marketing/campanhas',
      });
    }

    // Oportunidade de conversão
    if (metrics.experimentaisAgendadas > 0) {
      alerts.push({
        id: 'experimentais-pendentes',
        tipo: 'oportunidade',
        titulo: `${metrics.experimentaisAgendadas} aula(s) experimental(is) agendada(s)`,
        descricao: `Taxa de conversão atual: ${metrics.taxaConversaoExperimental.toFixed(0)}%`,
        acao: 'Ver experimentais',
        rota: '/experimentais',
        quantidade: metrics.experimentaisAgendadas,
      });
    }

    // Aulas hoje
    if (metrics.aulasHoje > 0) {
      alerts.push({
        id: 'aulas-hoje',
        tipo: 'info',
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
