
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabasePlan {
  id: string;
  nome: string;
  tipo?: 'mensal' | 'avulso' | 'pacote';
  valor: number;
  preco?: number;
  duracao_dias?: number;
  duracao_meses?: number;
  quantidade_aulas?: number;
  beneficios?: string[];
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useSupabasePlans() {
  const [plans, setPlans] = useState<SupabasePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('valor', { ascending: true });

      if (error) throw error;
      
      const typedPlans = (data || []).map(plan => ({
        ...plan,
        tipo: plan.tipo as 'mensal' | 'avulso' | 'pacote' | undefined,
      })) as SupabasePlan[];
      
      setPlans(typedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlan = async (planData: Omit<SupabasePlan, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;
      
      const typedPlan = {
        ...data,
        tipo: data.tipo as 'mensal' | 'avulso' | 'pacote' | undefined,
      } as SupabasePlan;
      
      setPlans(prev => [...prev, typedPlan]);
      toast({
        title: "Sucesso",
        description: "Plano criado com sucesso",
      });
      
      return typedPlan;
    } catch (error) {
      console.error('Error adding plan:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o plano",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlan = async (id: string, planData: Partial<SupabasePlan>) => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .update(planData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const typedPlan = {
        ...data,
        tipo: data.tipo as 'mensal' | 'avulso' | 'pacote' | undefined,
      } as SupabasePlan;
      
      setPlans(prev => prev.map(plan => plan.id === id ? typedPlan : plan));
      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso",
      });
      
      return typedPlan;
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPlans(prev => prev.filter(plan => plan.id !== id));
      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    addPlan,
    updatePlan,
    deletePlan,
    refetch: fetchPlans
  };
}
