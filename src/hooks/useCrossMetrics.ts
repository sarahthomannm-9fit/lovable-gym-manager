import { useMemo } from 'react';
import { SupabaseStudent } from '@/hooks/useSupabaseStudents';
import { SupabaseCheckIn } from '@/hooks/useSupabaseCheckIns';
import { AvaliacaoFisica } from '@/hooks/useAvaliacoesFisicas';
import { AulaExperimental } from '@/hooks/useAulasExperimentais';
import { SupabaseClass } from '@/hooks/useSupabaseClasses';
// Note: SupabaseClass may not have inscritos_atual, so we handle it safely
import { Funcionario } from '@/hooks/useFuncionarios';

export interface CrossMetrics {
  // Alunos
  totalAlunos: number;
  alunosAtivos: number;
  alunosInativos: number;
  alunosComTreinoVencido: number;
  alunosComAvaliacaoPendente: number;
  taxaRetencao: number;

  // Financeiro
  receitaMensal: number;
  receitaAnterior: number;
  crescimentoReceita: number;
  ticketMedio: number;
  inadimplencia: number;
  totalInadimplente: number;
  ltvMedio: number;
  cacEstimado: number;

  // Conversão
  taxaConversaoExperimental: number;
  leadsTotal: number;
  leadsConvertidos: number;
  experimentaisAgendadas: number;

  // Aulas
  totalAulas: number;
  aulasHoje: number;
  ocupacaoMedia: number;

  // Equipe
  totalFuncionarios: number;
  professoresAtivos: number;
  cargaHorariaPorProfessor: Record<string, number>;

  // Churn
  churnRisk: { id: string; nome: string; motivos: string[] }[];

  // Cobranças próximas (2 dias antes do dia_pagamento)
  cobrancasProximas: number;

  // War Room extras
  aulasSemInstrutor: number;
  assinaturasVencendo: number;
  leadsSemFollowup: number;
}

interface CrossMetricsInput {
  alunos: SupabaseStudent[];
  pagamentos: any[];
  planos: any[];
  checkins: SupabaseCheckIn[];
  avaliacoes: AvaliacaoFisica[];
  treinos: any[];
  experimentais: AulaExperimental[];
  aulas: SupabaseClass[];
  funcionarios: Funcionario[];
  leads: any[];
  campanhas: any[];
}

export function useCrossMetrics(data: CrossMetricsInput): CrossMetrics {
  return useMemo(() => {
    const { alunos, pagamentos, planos, checkins, avaliacoes, treinos, experimentais, aulas, funcionarios, leads, campanhas } = data;
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    const quinzeDiasAtras = new Date(hoje.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0];
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString().split('T')[0];

    // Alunos ativos/inativos
    const alunosAtivos = alunos.filter(a => a.status === 'ativo').length;
    const totalAlunos = alunos.length;

    // Alunos sem checkin nos últimos 15 dias
    const alunosComCheckinRecente = new Set(
      checkins.filter(c => c.data_checkin && c.data_checkin >= quinzeDiasAtras).map(c => c.aluno_id)
    );
    const alunosInativos = alunos.filter(a => a.status === 'ativo' && !alunosComCheckinRecente.has(a.id)).length;

    // Treinos vencidos
    const alunosComTreinoVencido = new Set(
      treinos.filter((t: any) => t.data_fim && t.data_fim < hojeStr).map((t: any) => t.aluno_id)
    ).size;

    // Avaliações pendentes
    const alunosComAvaliacaoPendente = avaliacoes.filter(a => a.proxima_avaliacao && a.proxima_avaliacao < hojeStr).length;

    // Retenção
    const taxaRetencao = totalAlunos > 0 ? (alunosAtivos / totalAlunos) * 100 : 0;

    // Financeiro
    const pagamentosMes = pagamentos.filter((p: any) => p.status === 'pago' && p.data_pagamento && p.data_pagamento >= inicioMes);
    const receitaMensal = pagamentosMes.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);

    const pagamentosMesAnterior = pagamentos.filter((p: any) => 
      p.status === 'pago' && p.data_pagamento && p.data_pagamento >= inicioMesAnterior && p.data_pagamento <= fimMesAnterior
    );
    const receitaAnterior = pagamentosMesAnterior.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
    const crescimentoReceita = receitaAnterior > 0 ? ((receitaMensal - receitaAnterior) / receitaAnterior) * 100 : 0;

    const ticketMedio = pagamentosMes.length > 0 ? receitaMensal / pagamentosMes.length : 0;

    // Inadimplência
    const pagamentosVencidos = pagamentos.filter((p: any) => p.status === 'pendente' && p.data_vencimento < hojeStr);
    const inadimplencia = pagamentosVencidos.length;
    const totalInadimplente = pagamentosVencidos.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);

    // LTV médio
    const receitaTotal = pagamentos.filter((p: any) => p.status === 'pago').reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
    const ltvMedio = alunosAtivos > 0 ? receitaTotal / alunosAtivos : 0;

    // CAC estimado
    const orcamentoCampanhas = campanhas.reduce((sum: number, c: any) => sum + (c.orcamento || 0), 0);
    const conversoesCampanhas = campanhas.reduce((sum: number, c: any) => sum + (c.conversoes || 0), 0);
    const cacEstimado = conversoesCampanhas > 0 ? orcamentoCampanhas / conversoesCampanhas : 0;

    // Conversão experimental
    const experimentaisConvertidas = experimentais.filter(e => e.status === 'convertida').length;
    const experimentaisFinalizadas = experimentais.filter(e => ['realizada', 'convertida', 'nao_convertida'].includes(e.status)).length;
    const taxaConversaoExperimental = experimentaisFinalizadas > 0 ? (experimentaisConvertidas / experimentaisFinalizadas) * 100 : 0;

    // Leads
    const leadsConvertidos = leads.filter((l: any) => l.status === 'convertido').length;

    // Aulas
    const aulasHoje = aulas.filter(a => a.data_aula === hojeStr).length;
    const ocupacaoMedia = aulas.length > 0
      ? aulas.reduce((sum, a) => {
          const cap = a.capacidade_maxima || 20;
          const ins = (a as any).inscritos_atual || 0;
          return sum + (ins / cap) * 100;
        }, 0) / aulas.length
      : 0;

    // Equipe
    const professoresAtivos = funcionarios.filter(f => f.ativo && ['professor', 'personal'].includes(f.cargo)).length;
    const cargaHorariaPorProfessor: Record<string, number> = {};
    aulas.forEach(a => {
      if (a.professor_id) {
        cargaHorariaPorProfessor[a.professor_id] = (cargaHorariaPorProfessor[a.professor_id] || 0) + 1;
      }
    });

    // Churn risk
    const inadimplentesSet = new Set(pagamentosVencidos.map((p: any) => p.aluno_id));
    const churnRisk = alunos
      .filter(a => a.status === 'ativo')
      .map(a => {
        const motivos: string[] = [];
        if (!alunosComCheckinRecente.has(a.id)) motivos.push('Sem frequência (15+ dias)');
        if (inadimplentesSet.has(a.id)) motivos.push('Pagamento atrasado');
        const treinoVencido = treinos.find((t: any) => t.aluno_id === a.id && t.data_fim && t.data_fim < hojeStr);
        if (treinoVencido) motivos.push('Treino vencido');
        return { id: a.id, nome: a.nome, motivos };
      })
      .filter(a => a.motivos.length > 0)
      .sort((a, b) => b.motivos.length - a.motivos.length);

    // Cobranças próximas (2 dias antes do dia_pagamento)
    const diaHoje = hoje.getDate();
    const cobrancasProximas = alunos.filter(a => {
      if (a.status !== 'ativo' || !a.dia_pagamento) return false;
      const diff = a.dia_pagamento - diaHoje;
      return diff >= 0 && diff <= 2;
    }).length;

    // War Room: aulas sem instrutor (hoje e amanhã)
    const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const aulasSemInstrutor = aulas.filter(a => 
      (a.data_aula === hojeStr || a.data_aula === amanha) && !a.professor_id
    ).length;

    // War Room: assinaturas vencendo em 7 dias
    const seteDiasFrente = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const assinaturasVencendo = alunos.filter(a => {
      if (a.status !== 'ativo' || !a.dia_pagamento) return false;
      // Simple: check if dia_pagamento is within next 7 days
      const diaHojeN = hoje.getDate();
      const diff = a.dia_pagamento - diaHojeN;
      return diff >= 0 && diff <= 7;
    }).length;

    // War Room: leads sem follow-up (24h+)
    const vintQuatroHAtras = new Date(hoje.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const leadsSemFollowup = leads.filter((l: any) => 
      l.status === 'novo' && l.created_at && l.created_at < vintQuatroHAtras
    ).length;

    return {
      totalAlunos,
      alunosAtivos,
      alunosInativos,
      alunosComTreinoVencido,
      alunosComAvaliacaoPendente,
      taxaRetencao,
      receitaMensal,
      receitaAnterior,
      crescimentoReceita,
      ticketMedio,
      inadimplencia,
      totalInadimplente,
      ltvMedio,
      cacEstimado,
      taxaConversaoExperimental,
      leadsTotal: leads.length,
      leadsConvertidos,
      experimentaisAgendadas: experimentais.filter(e => e.status === 'agendada').length,
      totalAulas: aulas.length,
      aulasHoje,
      ocupacaoMedia,
      totalFuncionarios: funcionarios.length,
      professoresAtivos,
      cargaHorariaPorProfessor,
      churnRisk,
      cobrancasProximas,
      aulasSemInstrutor,
      assinaturasVencendo,
      leadsSemFollowup,
    };
  }, [data]);
}
