
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabasePlanHistory {
  id: string;
  aluno_id?: string;
  plano_id?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: 'ativo' | 'inativo';
  forma_pagamento_id?: string;
  created_at?: string;
  updated_at?: string;
}

export function useSupabasePlanHistory() {
  const [planHistory, setPlanHistory] = useState<SupabasePlanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlanHistory = async (studentId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('alunos_planos')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('aluno_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'ativo' | 'inativo' | undefined,
      })) as SupabasePlanHistory[];
      
      setPlanHistory(typedData);
    } catch (error) {
      console.error('Error fetching plan history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de planos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlanHistory = async (historyData: Omit<SupabasePlanHistory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('alunos_planos')
        .insert([historyData])
        .select()
        .single();

      if (error) throw error;
      
      const typedData = {
        ...data,
        status: data.status as 'ativo' | 'inativo' | undefined,
      } as SupabasePlanHistory;
      
      setPlanHistory(prev => [typedData, ...prev]);
      toast({
        title: "Sucesso",
        description: "Histórico de plano adicionado com sucesso!",
      });
      
      return typedData;
    } catch (error) {
      console.error('Error adding plan history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o histórico de plano",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlanHistory = async (id: string, updates: Partial<SupabasePlanHistory>) => {
    try {
      const { data, error } = await supabase
        .from('alunos_planos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const typedData = {
        ...data,
        status: data.status as 'ativo' | 'inativo' | undefined,
      } as SupabasePlanHistory;
      
      setPlanHistory(prev => prev.map(h => h.id === id ? typedData : h));
      toast({
        title: "Sucesso",
        description: "Histórico de plano atualizado com sucesso!",
      });
      
      return typedData;
    } catch (error) {
      console.error('Error updating plan history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o histórico de plano",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPlanHistory();
  }, []);

  return {
    planHistory,
    loading,
    addPlanHistory,
    updatePlanHistory,
    refetch: fetchPlanHistory
  };
}
