
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FaturamentoMensal {
  mes: string;
  total_faturado: number;
  total_recebido: number;
  total_pendente: number;
  quantidade_pagamentos: number;
}

export interface InadimplenciaItem {
  aluno_nome: string;
  aluno_id: string;
  valor_em_atraso: number;
  dias_atraso: number;
  plano_nome: string;
  metodo_pagamento: string;
  telefone: string;
}

export interface MetricasGerais {
  ticket_medio: number;
  total_alunos_ativos: number;
  total_receita_mes_atual: number;
  total_receita_mes_anterior: number;
  crescimento_percentual: number;
  formas_pagamento_distintas: number;
}

export interface EvolucaoReceita {
  mes: string;
  receita: number;
  quantidade_pagamentos: number;
  ticket_medio: number;
}

export function useSupabaseFinancialReports() {
  const [faturamentoMensal, setFaturamentoMensal] = useState<FaturamentoMensal[]>([]);
  const [inadimplencia, setInadimplencia] = useState<InadimplenciaItem[]>([]);
  const [metricasGerais, setMetricasGerais] = useState<MetricasGerais | null>(null);
  const [evolucaoReceitas, setEvolucaoReceitas] = useState<EvolucaoReceita[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFaturamentoMensal = async () => {
    try {
      console.log('Buscando faturamento mensal...');
      const { data, error } = await supabase.rpc('relatorio_faturamento_mensal');
      
      if (error) {
        console.error('Erro na função relatorio_faturamento_mensal:', error);
        throw error;
      }
      
      console.log('Dados faturamento mensal:', data);
      setFaturamentoMensal(data || []);
    } catch (error) {
      console.error('Erro ao buscar faturamento mensal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o faturamento mensal",
        variant: "destructive",
      });
    }
  };

  const fetchInadimplencia = async () => {
    try {
      console.log('Buscando inadimplência...');
      const { data, error } = await supabase.rpc('relatorio_inadimplencia');
      
      if (error) {
        console.error('Erro na função relatorio_inadimplencia:', error);
        throw error;
      }
      
      console.log('Dados inadimplência:', data);
      setInadimplencia(data || []);
    } catch (error) {
      console.error('Erro ao buscar inadimplência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de inadimplência",
        variant: "destructive",
      });
    }
  };

  const fetchMetricasGerais = async () => {
    try {
      console.log('Buscando métricas gerais...');
      const { data, error } = await supabase.rpc('relatorio_metricas_gerais');
      
      if (error) {
        console.error('Erro na função relatorio_metricas_gerais:', error);
        throw error;
      }
      
      console.log('Dados métricas gerais:', data);
      setMetricasGerais(data?.[0] || null);
    } catch (error) {
      console.error('Erro ao buscar métricas gerais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as métricas gerais",
        variant: "destructive",
      });
    }
  };

  const fetchEvolucaoReceitas = async () => {
    try {
      console.log('Buscando evolução de receitas...');
      const { data, error } = await supabase.rpc('relatorio_evolucao_receitas');
      
      if (error) {
        console.error('Erro na função relatorio_evolucao_receitas:', error);
        throw error;
      }
      
      console.log('Dados evolução receitas:', data);
      setEvolucaoReceitas(data || []);
    } catch (error) {
      console.error('Erro ao buscar evolução de receitas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a evolução de receitas",
        variant: "destructive",
      });
    }
  };

  const fetchAllReports = async () => {
    setLoading(true);
    await Promise.all([
      fetchFaturamentoMensal(),
      fetchInadimplencia(),
      fetchMetricasGerais(),
      fetchEvolucaoReceitas()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllReports();
  }, []);

  return {
    faturamentoMensal,
    inadimplencia,
    metricasGerais,
    evolucaoReceitas,
    loading,
    refetch: fetchAllReports
  };
}
