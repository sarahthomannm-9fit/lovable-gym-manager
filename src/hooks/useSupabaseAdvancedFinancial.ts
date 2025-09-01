import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnaliseAvancada {
  periodo: string;
  receita_atual: number;
  receita_projetada: number;
  taxa_crescimento: number;
  variabilidade: number;
  risco_inadimplencia: string;
  estrategias_retencao: any;
  recomendacoes: any;
}

export interface ProjecaoCenario {
  cenario: string;
  receita_projetada_3m: number;
  receita_projetada_6m: number;
  receita_projetada_12m: number;
  investimento_necessario: number;
  roi_estimado: number;
}

export function useSupabaseAdvancedFinancial() {
  const [analiseAvancada, setAnaliseAvancada] = useState<AnaliseAvancada[]>([]);
  const [projecoesCenarios, setProjecoesCenarios] = useState<ProjecaoCenario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnaliseAvancada = async () => {
    try {
      const { data, error } = await supabase.rpc('analise_faturamento_avancada');
      if (error) throw error;
      setAnaliseAvancada(data || []);
    } catch (error) {
      console.error('Erro ao buscar análise avançada:', error);
    }
  };

  const fetchProjecoesCenarios = async () => {
    try {
      const { data, error } = await supabase.rpc('projecao_cenarios');
      if (error) throw error;
      setProjecoesCenarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar projeções:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAnaliseAvancada(),
      fetchProjecoesCenarios()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    analiseAvancada,
    projecoesCenarios,
    loading,
    refetch: fetchAllData
  };
}