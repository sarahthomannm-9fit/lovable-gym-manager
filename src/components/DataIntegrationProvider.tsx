import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSupabaseStudents } from '@/hooks/useSupabaseStudents';
import { useSupabasePlans } from '@/hooks/useSupabasePlans';
import { useSupabasePayments } from '@/hooks/useSupabasePayments';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { useSupabaseCampaigns } from '@/hooks/marketing/useSupabaseCampaigns';
import { useSupabaseFinancialReports } from '@/hooks/useSupabaseFinancialReports';

interface IntegratedData {
  // Dados básicos
  alunos: any[];
  planos: any[];
  pagamentos: any[];
  aulas: any[];
  produtos: any[];
  campanhas: any[];
  
  // Métricas cruzadas
  alunosPorPlano: { [key: string]: number };
  faturamentoPorPlano: { [key: string]: number };
  conversaoLeadsPorCampanha: { [key: string]: number };
  produtosPorStatus: { [key: string]: number };
  
  // Insights e recomendações
  insights: {
    retencao: any[];
    crescimento: any[];
    otimizacao: any[];
  };
  
  loading: boolean;
  refetchAll: () => void;
}

const DataIntegrationContext = createContext<IntegratedData>({} as IntegratedData);

export function DataIntegrationProvider({ children }: { children: React.ReactNode }) {
  const { students: alunos, loading: loadingStudents, refetch: refetchStudents } = useSupabaseStudents();
  const { plans: planos, loading: loadingPlans, refetch: refetchPlans } = useSupabasePlans();
  const { payments: pagamentos, loading: loadingPayments, refetch: refetchPayments } = useSupabasePayments();
  const { classes: aulas, loading: loadingClasses, refetch: refetchClasses } = useSupabaseClasses();
  const { produtos, loading: loadingProdutos, refetch: refetchProdutos } = useSupabaseProdutos();
  const { campaigns: campanhas, campaignsLoading: loadingCampaigns, refetchCampaigns } = useSupabaseCampaigns();

  const [integratedData, setIntegratedData] = useState<Partial<IntegratedData>>({});

  const loading = loadingStudents || loadingPlans || loadingPayments || 
                 loadingClasses || loadingProdutos || loadingCampaigns;

  useEffect(() => {
    if (!loading) {
      processIntegratedData();
    }
  }, [alunos, planos, pagamentos, aulas, produtos, campanhas, loading]);

  const processIntegratedData = () => {
    // Processar dados cruzados
    const alunosPorPlano: { [key: string]: number } = {};
    const faturamentoPorPlano: { [key: string]: number } = {};
    
    // Agrupar alunos por plano
    alunos?.forEach(aluno => {
      if (aluno.plano_id) {
        const plano = planos?.find(p => p.id === aluno.plano_id);
        const nomeePlano = plano?.nome || 'Sem plano';
        alunosPorPlano[nomeePlano] = (alunosPorPlano[nomeePlano] || 0) + 1;
      }
    });

    // Faturamento por plano
    pagamentos?.forEach(pagamento => {
      if (pagamento.status === 'pago' && pagamento.aluno_id) {
        const aluno = alunos?.find(a => a.id === pagamento.aluno_id);
        if (aluno?.plano_id) {
          const plano = planos?.find(p => p.id === aluno.plano_id);
          const nomePlano = plano?.nome || 'Sem plano';
          faturamentoPorPlano[nomePlano] = (faturamentoPorPlano[nomePlano] || 0) + (pagamento.valor || 0);
        }
      }
    });

    // Conversão de campanhas (simulado - em produção viria de métricas reais)
    const conversaoLeadsPorCampanha: { [key: string]: number } = {};
    campanhas?.forEach(campanha => {
      // Simular taxa de conversão baseada no orçamento e canal
      const taxaBase = campanha.canal === 'google_ads' ? 3.5 : 
                     campanha.canal === 'facebook_ads' ? 2.8 : 
                     campanha.canal === 'instagram' ? 2.2 : 1.5;
      conversaoLeadsPorCampanha[campanha.titulo] = taxaBase;
    });

    // Produtos por status
    const produtosPorStatus: { [key: string]: number } = {};
    produtos?.forEach(produto => {
      produtosPorStatus[produto.status] = (produtosPorStatus[produto.status] || 0) + 1;
    });

    // Gerar insights automatizados
    const insights = gerarInsights({
      alunos: alunos || [],
      pagamentos: pagamentos || [],
      planos: planos || [],
      alunosPorPlano,
      faturamentoPorPlano
    });

    setIntegratedData({
      alunosPorPlano,
      faturamentoPorPlano,
      conversaoLeadsPorCampanha,
      produtosPorStatus,
      insights
    });
  };

  const gerarInsights = (data: any) => {
    const insights = {
      retencao: [] as any[],
      crescimento: [] as any[],
      otimizacao: [] as any[]
    };

    // Insights de retenção
    const totalAlunos = data.alunos.length;
    const alunosAtivos = data.alunos.filter((a: any) => a.status === 'ativo').length;
    const taxaRetencao = totalAlunos > 0 ? (alunosAtivos / totalAlunos) * 100 : 0;

    if (taxaRetencao < 80) {
      insights.retencao.push({
        tipo: 'alerta',
        titulo: 'Taxa de Retenção Baixa',
        descricao: `Taxa atual: ${taxaRetencao.toFixed(1)}%. Recomendamos implementar programa de fidelidade.`,
        acao: 'Criar campanha de engajamento',
        prioridade: 'alta'
      });
    }

    // Insights de crescimento
    const receitaTotal = data.pagamentos
      .filter((p: any) => p.status === 'pago')
      .reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
    
    const metaReceita = totalAlunos * 150; // Meta de R$ 150 por aluno
    if (receitaTotal < metaReceita) {
      insights.crescimento.push({
        tipo: 'oportunidade',
        titulo: 'Potencial de Crescimento',
        descricao: `Receita atual: R$ ${receitaTotal.toLocaleString('pt-BR')}. Meta: R$ ${metaReceita.toLocaleString('pt-BR')}.`,
        acao: 'Criar upsell para planos premium',
        prioridade: 'média'
      });
    }

    // Insights de otimização
    const planosComPoucosAlunos = Object.entries(data.alunosPorPlano)
      .filter(([_, count]) => (count as number) < 5);
    
    if (planosComPoucosAlunos.length > 0) {
      insights.otimizacao.push({
        tipo: 'sugestao',
        titulo: 'Otimização de Planos',
        descricao: `Planos com poucos alunos: ${planosComPoucosAlunos.map(([nome]) => nome).join(', ')}`,
        acao: 'Revisar estratégia de preços ou consolidar planos',
        prioridade: 'baixa'
      });
    }

    return insights;
  };

  const refetchAll = () => {
    refetchStudents();
    refetchPlans();
    refetchPayments(); 
    refetchClasses();
    refetchProdutos();
    refetchCampaigns();
  };

  const contextValue: IntegratedData = {
    alunos: alunos || [],
    planos: planos || [],
    pagamentos: pagamentos || [],
    aulas: aulas || [],
    produtos: produtos || [],
    campanhas: campanhas || [],
    alunosPorPlano: integratedData.alunosPorPlano || {},
    faturamentoPorPlano: integratedData.faturamentoPorPlano || {},
    conversaoLeadsPorCampanha: integratedData.conversaoLeadsPorCampanha || {},
    produtosPorStatus: integratedData.produtosPorStatus || {},
    insights: integratedData.insights || { retencao: [], crescimento: [], otimizacao: [] },
    loading,
    refetchAll
  };

  return (
    <DataIntegrationContext.Provider value={contextValue}>
      {children}
    </DataIntegrationContext.Provider>
  );
}

export const useDataIntegration = () => {
  const context = useContext(DataIntegrationContext);
  if (!context) {
    throw new Error('useDataIntegration deve ser usado dentro de DataIntegrationProvider');
  }
  return context;
};