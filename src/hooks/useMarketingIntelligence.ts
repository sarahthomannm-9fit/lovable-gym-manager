import { useMemo } from 'react';

export interface MarketingInsight {
  id: string;
  tipo: 'campanha' | 'lead' | 'conversao' | 'remarketing';
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  acao: string;
}

interface MarketingInput {
  campanhas: any[];
  leads: any[];
  experimentais: any[];
  alunos: any[];
}

export function useMarketingIntelligence(data: MarketingInput) {
  return useMemo(() => {
    const insights: MarketingInsight[] = [];
    const hoje = new Date();

    // Campanhas com bom ROI
    const campanhasAtivas = (data.campanhas || []).filter((c: any) => c.status === 'ativa');
    campanhasAtivas.forEach((c: any) => {
      if (c.conversoes > 0 && c.orcamento > 0) {
        const roi = (c.conversoes * 150) / c.orcamento; // ticket médio estimado
        if (roi > 2) {
          insights.push({
            id: `camp-roi-${c.id}`,
            tipo: 'campanha',
            titulo: `${c.titulo} tem ROI ${roi.toFixed(1)}x`,
            descricao: `${c.conversoes} conversões com R$ ${c.orcamento} investidos. Considere aumentar orçamento.`,
            prioridade: 'alta',
            acao: 'Aumentar orçamento',
          });
        }
      }
      if (c.alcance > 100 && c.conversoes === 0) {
        insights.push({
          id: `camp-low-${c.id}`,
          tipo: 'campanha',
          titulo: `${c.titulo} sem conversões`,
          descricao: `${c.alcance} alcançados mas 0 conversões. Revise público-alvo ou criativos.`,
          prioridade: 'media',
          acao: 'Revisar campanha',
        });
      }
    });

    // Leads sem follow-up
    const leadsRecentes = (data.leads || []).filter((l: any) => {
      const dias = Math.floor((hoje.getTime() - new Date(l.created_at).getTime()) / 86400000);
      return l.status === 'novo' && dias >= 2 && dias <= 7;
    });
    if (leadsRecentes.length > 0) {
      insights.push({
        id: 'leads-followup',
        tipo: 'lead',
        titulo: `${leadsRecentes.length} lead(s) sem follow-up`,
        descricao: `Leads novos há 2-7 dias sem contato. Janela de conversão fechando.`,
        prioridade: 'alta',
        acao: 'Contatar agora',
      });
    }

    // Taxa de conversão experimental
    const totalExp = (data.experimentais || []).length;
    const convertidos = (data.experimentais || []).filter((e: any) => e.status === 'convertido').length;
    if (totalExp >= 5) {
      const taxa = (convertidos / totalExp) * 100;
      if (taxa < 30) {
        insights.push({
          id: 'conv-baixa',
          tipo: 'conversao',
          titulo: `Taxa de conversão baixa: ${taxa.toFixed(0)}%`,
          descricao: `${convertidos}/${totalExp} experimentais converteram. Revise abordagem pós-aula.`,
          prioridade: 'alta',
          acao: 'Otimizar follow-up',
        });
      }
    }

    // Experimentais recentes não contatadas
    const expRecentes = (data.experimentais || []).filter((e: any) => {
      const dias = Math.floor((hoje.getTime() - new Date(e.data_agendada).getTime()) / 86400000);
      return e.status === 'realizada' && dias >= 1 && dias <= 3;
    });
    expRecentes.forEach((e: any) => {
      insights.push({
        id: `exp-proposta-${e.id}`,
        tipo: 'conversao',
        titulo: `Enviar proposta para ${e.nome}`,
        descricao: `Fez aula experimental. Janela ideal de conversão (48h).`,
        prioridade: 'alta',
        acao: 'Enviar proposta',
      });
    });

    // Churn risk → remarketing
    const inativos = (data.alunos || []).filter((a: any) => a.status === 'inativo' || a.lifecycle_status === 'inativo');
    if (inativos.length > 3) {
      insights.push({
        id: 'remarketing-inativos',
        tipo: 'remarketing',
        titulo: `${inativos.length} ex-alunos para remarketing`,
        descricao: `Alunos inativos podem ser reengajados com ofertas personalizadas.`,
        prioridade: 'media',
        acao: 'Criar campanha',
      });
    }

    return {
      insights: insights.sort((a, b) => {
        const p = { alta: 0, media: 1, baixa: 2 };
        return p[a.prioridade] - p[b.prioridade];
      }),
      totalInsights: insights.length,
      altaPrioridade: insights.filter(i => i.prioridade === 'alta').length,
    };
  }, [data]);
}
