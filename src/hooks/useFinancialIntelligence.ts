import { useMemo } from 'react';

export interface FinancialAlert {
  id: string;
  tipo: 'mrr' | 'inadimplencia' | 'cashflow' | 'projecao';
  titulo: string;
  descricao: string;
  valor?: number;
  severidade: 'critico' | 'atencao' | 'info';
}

interface FinancialInput {
  pagamentos: any[];
  alunos: any[];
  assinaturas: any[];
  planos: any[];
}

export function useFinancialIntelligence(data: FinancialInput) {
  return useMemo(() => {
    const alerts: FinancialAlert[] = [];
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    // MRR calculation
    const ativos = (data.alunos || []).filter((a: any) => a.status === 'ativo');
    const mrr = ativos.reduce((sum: number, a: any) => sum + (a.valor_mensalidade || 0), 0);

    // Inadimplência
    const vencidos = (data.pagamentos || []).filter((p: any) =>
      p.status !== 'pago' && p.data_vencimento < hojeStr
    );
    const totalInadimplente = vencidos.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
    const taxaInadimplencia = mrr > 0 ? (totalInadimplente / mrr) * 100 : 0;

    if (taxaInadimplencia > 15) {
      alerts.push({
        id: 'inad-critico',
        tipo: 'inadimplencia',
        titulo: `Inadimplência crítica: ${taxaInadimplencia.toFixed(0)}%`,
        descricao: `R$ ${totalInadimplente.toLocaleString('pt-BR')} em atraso representam ${taxaInadimplencia.toFixed(1)}% do MRR.`,
        valor: totalInadimplente,
        severidade: 'critico',
      });
    } else if (taxaInadimplencia > 8) {
      alerts.push({
        id: 'inad-atencao',
        tipo: 'inadimplencia',
        titulo: `Inadimplência em atenção: ${taxaInadimplencia.toFixed(0)}%`,
        descricao: `R$ ${totalInadimplente.toLocaleString('pt-BR')} em atraso. Ativar régua de cobrança.`,
        valor: totalInadimplente,
        severidade: 'atencao',
      });
    }

    // Assinaturas vencendo em 7 dias
    const seteDias = new Date(hoje.getTime() + 7 * 86400000).toISOString().split('T')[0];
    const assinaturasVencendo = (data.assinaturas || []).filter((a: any) =>
      a.status === 'ativa' && a.data_proxima_cobranca && a.data_proxima_cobranca <= seteDias && a.data_proxima_cobranca >= hojeStr
    );
    const valorVencendo = assinaturasVencendo.reduce((sum: number, a: any) => sum + (a.valor_recorrente || 0), 0);

    if (assinaturasVencendo.length > 0) {
      alerts.push({
        id: 'assin-vencendo',
        tipo: 'projecao',
        titulo: `${assinaturasVencendo.length} renovações nos próximos 7 dias`,
        descricao: `R$ ${valorVencendo.toLocaleString('pt-BR')} em cobranças pendentes de confirmação.`,
        valor: valorVencendo,
        severidade: assinaturasVencendo.length > 5 ? 'atencao' : 'info',
      });
    }

    // Cash flow alert
    const recebidoMes = (data.pagamentos || []).filter((p: any) => {
      if (p.status !== 'pago' || !p.data_pagamento) return false;
      const mes = p.data_pagamento.substring(0, 7);
      return mes === hojeStr.substring(0, 7);
    }).reduce((sum: number, p: any) => sum + (p.valor || 0), 0);

    const projecaoMes = mrr;
    const gapReceita = projecaoMes - recebidoMes;

    if (gapReceita > 0 && hoje.getDate() > 15) {
      const pctRecebido = projecaoMes > 0 ? (recebidoMes / projecaoMes) * 100 : 0;
      if (pctRecebido < 60) {
        alerts.push({
          id: 'cashflow-gap',
          tipo: 'cashflow',
          titulo: `Apenas ${pctRecebido.toFixed(0)}% do MRR recebido`,
          descricao: `R$ ${recebidoMes.toLocaleString('pt-BR')} de R$ ${projecaoMes.toLocaleString('pt-BR')} projetados. Faltam R$ ${gapReceita.toLocaleString('pt-BR')}.`,
          valor: gapReceita,
          severidade: pctRecebido < 40 ? 'critico' : 'atencao',
        });
      }
    }

    // Health score (0-100)
    let healthScore = 100;
    if (taxaInadimplencia > 5) healthScore -= Math.min(taxaInadimplencia * 2, 30);
    const churnRate = ativos.length > 0
      ? ((data.alunos || []).filter((a: any) => a.status !== 'ativo').length / (data.alunos || []).length) * 100
      : 0;
    if (churnRate > 5) healthScore -= Math.min(churnRate * 2, 20);
    if (mrr === 0) healthScore -= 30;
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    return {
      alerts: alerts.sort((a, b) => {
        const s = { critico: 0, atencao: 1, info: 2 };
        return s[a.severidade] - s[b.severidade];
      }),
      mrr,
      totalInadimplente,
      taxaInadimplencia,
      healthScore,
      recebidoMes,
      projecaoMes: mrr,
    };
  }, [data]);
}
