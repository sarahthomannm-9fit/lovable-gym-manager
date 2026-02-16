import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useSupabaseStudents } from '@/hooks/useSupabaseStudents';
import { useSupabasePlans } from '@/hooks/useSupabasePlans';
import { useSupabasePayments } from '@/hooks/useSupabasePayments';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { useSupabaseCampaigns } from '@/hooks/marketing/useSupabaseCampaigns';
import { useSupabaseCheckIns } from '@/hooks/useSupabaseCheckIns';
import { useAvaliacoesFisicas } from '@/hooks/useAvaliacoesFisicas';
import { useAulasExperimentais } from '@/hooks/useAulasExperimentais';
import { useFrequencia } from '@/hooks/useFrequencia';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { useSupabaseLeads } from '@/hooks/marketing/useSupabaseLeads';
import { useCrossMetrics, CrossMetrics } from '@/hooks/useCrossMetrics';
import { useSmartAlerts, SmartAlert } from '@/hooks/useSmartAlerts';

interface IntegratedData {
  // Dados brutos
  alunos: any[];
  planos: any[];
  pagamentos: any[];
  aulas: any[];
  produtos: any[];
  campanhas: any[];
  checkins: any[];
  avaliacoes: any[];
  treinos: any[];
  experimentais: any[];
  funcionarios: any[];
  notificacoes: any[];
  leads: any[];
  frequencias: any[];

  // Métricas cruzadas calculadas
  metrics: CrossMetrics;
  
  // Alertas inteligentes
  alerts: SmartAlert[];

  // Métricas legacy (mantidas por compatibilidade)
  alunosPorPlano: Record<string, number>;
  faturamentoPorPlano: Record<string, number>;
  conversaoLeadsPorCampanha: Record<string, number>;
  produtosPorStatus: Record<string, number>;
  insights: { retencao: any[]; crescimento: any[]; otimizacao: any[] };

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
  const { checkIns: checkins, loading: loadingCheckins, refetch: refetchCheckins } = useSupabaseCheckIns();
  const { avaliacoes, loading: loadingAvaliacoes, refetch: refetchAvaliacoes } = useAvaliacoesFisicas();
  const { aulasExperimentais: experimentais, loading: loadingExperimentais, refetch: refetchExperimentais } = useAulasExperimentais();
  const { frequencias, loading: loadingFrequencias, refetch: refetchFrequencias } = useFrequencia();
  const { funcionarios, loading: loadingFuncionarios, refetch: refetchFuncionarios } = useFuncionarios();
  const { notificacoes, loading: loadingNotificacoes, refetch: refetchNotificacoes } = useNotificacoes();
  const { leads, leadsLoading: loadingLeads, refetchLeads } = useSupabaseLeads();

  const loading = loadingStudents || loadingPlans || loadingPayments || loadingClasses || 
    loadingProdutos || loadingCampaigns || loadingCheckins || loadingAvaliacoes || 
    loadingExperimentais || loadingFrequencias || loadingFuncionarios || loadingNotificacoes || loadingLeads;

  // Treinos - fetch directly since there's no dedicated hook in context
  const [treinos, setTreinos] = useState<any[]>([]);
  useEffect(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.from('treinos').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        setTreinos(data || []);
      });
    });
  }, []);

  // Cross metrics
  const metrics = useCrossMetrics({
    alunos: alunos || [],
    pagamentos: pagamentos || [],
    planos: planos || [],
    checkins: checkins || [],
    avaliacoes: avaliacoes || [],
    treinos,
    experimentais: experimentais || [],
    aulas: aulas || [],
    funcionarios: funcionarios || [],
    leads: leads || [],
    campanhas: campanhas || [],
  });

  // Smart alerts
  const alerts = useSmartAlerts(metrics);

  // Legacy metrics (backward compat)
  const legacyMetrics = useMemo(() => {
    const alunosPorPlano: Record<string, number> = {};
    const faturamentoPorPlano: Record<string, number> = {};
    
    (alunos || []).forEach((aluno: any) => {
      if (aluno.plano_id) {
        const plano = (planos || []).find((p: any) => p.id === aluno.plano_id);
        const nome = plano?.nome || 'Sem plano';
        alunosPorPlano[nome] = (alunosPorPlano[nome] || 0) + 1;
      }
    });

    (pagamentos || []).forEach((pag: any) => {
      if (pag.status === 'pago' && pag.aluno_id) {
        const aluno = (alunos || []).find((a: any) => a.id === pag.aluno_id);
        if (aluno?.plano_id) {
          const plano = (planos || []).find((p: any) => p.id === aluno.plano_id);
          const nome = plano?.nome || 'Sem plano';
          faturamentoPorPlano[nome] = (faturamentoPorPlano[nome] || 0) + (pag.valor || 0);
        }
      }
    });

    const conversaoLeadsPorCampanha: Record<string, number> = {};
    (campanhas || []).forEach((c: any) => {
      conversaoLeadsPorCampanha[c.titulo] = c.conversoes || 0;
    });

    const produtosPorStatus: Record<string, number> = {};
    (produtos || []).forEach((p: any) => {
      produtosPorStatus[p.status] = (produtosPorStatus[p.status] || 0) + 1;
    });

    // Insights
    const insights = { retencao: [] as any[], crescimento: [] as any[], otimizacao: [] as any[] };
    
    if (metrics.taxaRetencao < 80 && metrics.totalAlunos > 0) {
      insights.retencao.push({
        tipo: 'alerta', titulo: 'Taxa de Retenção Baixa',
        descricao: `Taxa atual: ${metrics.taxaRetencao.toFixed(1)}%. Recomendamos programa de fidelidade.`,
        acao: 'Criar campanha de engajamento', prioridade: 'alta'
      });
    }

    if (metrics.crescimentoReceita < 0) {
      insights.crescimento.push({
        tipo: 'alerta', titulo: 'Queda na Receita',
        descricao: `Receita caiu ${Math.abs(metrics.crescimentoReceita).toFixed(1)}% vs mês anterior.`,
        acao: 'Analisar causas e criar promoções', prioridade: 'alta'
      });
    }

    const planosComPoucos = Object.entries(alunosPorPlano).filter(([, count]) => count < 5);
    if (planosComPoucos.length > 0) {
      insights.otimizacao.push({
        tipo: 'sugestao', titulo: 'Otimização de Planos',
        descricao: `Planos com poucos alunos: ${planosComPoucos.map(([n]) => n).join(', ')}`,
        acao: 'Revisar preços ou consolidar', prioridade: 'baixa'
      });
    }

    return { alunosPorPlano, faturamentoPorPlano, conversaoLeadsPorCampanha, produtosPorStatus, insights };
  }, [alunos, planos, pagamentos, campanhas, produtos, metrics]);

  const refetchAll = () => {
    refetchStudents(); refetchPlans(); refetchPayments(); refetchClasses();
    refetchProdutos(); refetchCampaigns(); refetchCheckins(); refetchAvaliacoes();
    refetchExperimentais(); refetchFrequencias(); refetchFuncionarios(); refetchNotificacoes();
    refetchLeads();
  };

  const contextValue: IntegratedData = {
    alunos: alunos || [],
    planos: planos || [],
    pagamentos: pagamentos || [],
    aulas: aulas || [],
    produtos: produtos || [],
    campanhas: campanhas || [],
    checkins: checkins || [],
    avaliacoes: avaliacoes || [],
    treinos,
    experimentais: experimentais || [],
    funcionarios: funcionarios || [],
    notificacoes: notificacoes || [],
    leads: leads || [],
    frequencias: frequencias || [],
    metrics,
    alerts,
    ...legacyMetrics,
    loading,
    refetchAll,
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
