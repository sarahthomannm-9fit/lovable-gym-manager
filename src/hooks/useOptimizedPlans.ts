import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Plan = Database['public']['Tables']['planos']['Row'];
type PlanInsert = Database['public']['Tables']['planos']['Insert'];

export function useOptimizedPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Plan[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const addPlan = useMutation({
    mutationFn: async (plan: PlanInsert) => {
      const { data, error } = await supabase
        .from('planos')
        .insert(plan)
        .select()
        .single();
      
      if (error) throw error;
      return data as Plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: 'Plano criado',
        description: 'Plano adicionado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar plano',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Plan> }) => {
      const { data, error } = await supabase
        .from('planos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: 'Plano atualizado',
        description: 'Plano modificado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar plano',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: 'Plano removido',
        description: 'Plano excluído com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover plano',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    plans,
    isLoading,
    error,
    addPlan: addPlan.mutateAsync,
    updatePlan: updatePlan.mutateAsync,
    deletePlan: deletePlan.mutateAsync,
    isAdding: addPlan.isPending,
    isUpdating: updatePlan.isPending,
    isDeleting: deletePlan.isPending,
  };
}