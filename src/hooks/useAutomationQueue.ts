import { useMemo } from 'react';
import { ClassifiedPagamento, ClassifiedAluno, ClassifiedLead } from './useBusinessEngine';

export interface AutomationItem {
  id: string;
  tipo: 'cobranca' | 'retencao' | 'remarketing' | 'renovacao';
  alvo: string; // nome do aluno/lead
  alvo_id: string;
  etapa: string;
  etapa_num: number;
  acao_sugerida: string;
  auto_executavel: boolean;
  valor?: number;
}

interface AutomationInput {
  pagamentos: ClassifiedPagamento[];
  alunos: ClassifiedAluno[];
  leads: ClassifiedLead[];
}

const REGUA_COBRANCA: Record<number, { etapa: string; acao: string; auto: boolean }> = {
  0: { etapa: 'Preventivo', acao: 'Lembrete WhatsApp', auto: true },
  1: { etapa: 'D+1 a D+3', acao: 'Mensagem tom leve', auto: true },
  2: { etapa: 'D+3 a D+7', acao: 'Email + link pagamento', auto: true },
  3: { etapa: 'D+7 a D+15', acao: 'Proposta negociação', auto: false },
  4: { etapa: 'D+15 a D+30', acao: 'Escalar para humano', auto: false },
  5: { etapa: 'D+30+', acao: 'Decisão final obrigatória', auto: false },
};

const RETENCAO_TIERS: { dias: number; etapa: string; acao: string; auto: boolean }[] = [
  { dias: 7, etapa: 'Watchlist', acao: 'Monitorar silenciosamente', auto: true },
  { dias: 14, etapa: 'Alerta médio', acao: 'Mensagem de engajamento', auto: true },
  { dias: 21, etapa: 'Alerta alto', acao: 'Mensagem com progresso', auto: false },
  { dias: 30, etapa: 'Crítico', acao: 'Contato direto obrigatório', auto: false },
];

export function useAutomationQueue(data: AutomationInput): {
  items: AutomationItem[];
  cobrancasPorEtapa: Record<string, number>;
  retencaoPorTier: Record<string, number>;
  remarketingPorTemp: Record<string, number>;
  totalAuto: number;
  totalHumano: number;
} {
  return useMemo(() => {
    const items: AutomationItem[] = [];

    // === COBRANÇAS ===
    const cobrancasPorEtapa: Record<string, number> = {};
    data.pagamentos
      .filter(p => p.etapaRegua > 0)
      .forEach(p => {
        const regua = REGUA_COBRANCA[p.etapaRegua] || REGUA_COBRANCA[5];
        cobrancasPorEtapa[regua.etapa] = (cobrancasPorEtapa[regua.etapa] || 0) + 1;
        items.push({
          id: `cob-${p.id}`,
          tipo: 'cobranca',
          alvo: p.aluno_nome,
          alvo_id: p.aluno_id,
          etapa: regua.etapa,
          etapa_num: p.etapaRegua,
          acao_sugerida: regua.acao,
          auto_executavel: regua.auto,
          valor: p.valor,
        });
      });

    // === RETENÇÃO ===
    const retencaoPorTier: Record<string, number> = {};
    data.alunos
      .filter(a => ['ativo_sem_freq', 'ativo_sem_freq_risco'].includes(a.estado))
      .forEach(a => {
        const tier = RETENCAO_TIERS.find(t => a.diasSemCheckin >= t.dias) 
          || RETENCAO_TIERS[RETENCAO_TIERS.length - 1];
        
        // Find the most appropriate tier
        let bestTier = RETENCAO_TIERS[0];
        for (const t of RETENCAO_TIERS) {
          if (a.diasSemCheckin >= t.dias) bestTier = t;
        }
        
        retencaoPorTier[bestTier.etapa] = (retencaoPorTier[bestTier.etapa] || 0) + 1;
        items.push({
          id: `ret-${a.id}`,
          tipo: 'retencao',
          alvo: a.nome,
          alvo_id: a.id,
          etapa: bestTier.etapa,
          etapa_num: RETENCAO_TIERS.indexOf(bestTier),
          acao_sugerida: bestTier.acao,
          auto_executavel: bestTier.auto,
        });
      });

    // === REMARKETING ===
    const remarketingPorTemp: Record<string, number> = {};
    data.leads
      .filter(l => !['convertido'].includes(l.estado))
      .forEach(l => {
        remarketingPorTemp[l.temperatura] = (remarketingPorTemp[l.temperatura] || 0) + 1;
        
        let acao = 'Mensagem mensal';
        let auto = true;
        if (l.temperatura === 'quente') { acao = 'Sequência 7d: d1, d3, d7'; }
        else if (l.temperatura === 'morno') { acao = 'Mensagem quinzenal + oferta'; }

        items.push({
          id: `rmk-${l.id}`,
          tipo: 'remarketing',
          alvo: l.nome,
          alvo_id: l.id,
          etapa: l.temperatura,
          etapa_num: l.temperatura === 'quente' ? 0 : l.temperatura === 'morno' ? 1 : 2,
          acao_sugerida: acao,
          auto_executavel: auto,
        });
      });

    const totalAuto = items.filter(i => i.auto_executavel).length;
    const totalHumano = items.filter(i => !i.auto_executavel).length;

    return { items, cobrancasPorEtapa, retencaoPorTier, remarketingPorTemp, totalAuto, totalHumano };
  }, [data]);
}
