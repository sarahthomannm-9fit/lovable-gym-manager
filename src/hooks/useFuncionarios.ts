import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Funcionario {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: 'professor' | 'recepcionista' | 'personal' | 'nutricionista' | 'fisioterapeuta' | 'gerente';
  especialidades: string[] | null;
  horarios: Record<string, any>;
  salario: number | null;
  data_contratacao: string | null;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type FuncionarioInput = Partial<Omit<Funcionario, 'id' | 'created_at' | 'updated_at'>> & {
  nome: string;
  cargo: Funcionario['cargo'];
};

export function useFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFuncionarios = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome');

      if (error) throw error;
      setFuncionarios((data || []) as Funcionario[]);
    } catch (error) {
      console.error('Error fetching funcionarios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addFuncionario = useCallback(async (funcionario: FuncionarioInput) => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert(funcionario)
        .select()
        .single();

      if (error) throw error;

      setFuncionarios(prev => [...prev, data as Funcionario]);
      toast({
        title: "Sucesso",
        description: "Funcionário adicionado com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error adding funcionario:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o funcionário",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const updateFuncionario = useCallback(async (id: string, updates: Partial<FuncionarioInput>) => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFuncionarios(prev => 
        prev.map(f => f.id === id ? (data as Funcionario) : f)
      );
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error updating funcionario:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o funcionário",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const deleteFuncionario = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFuncionarios(prev => prev.filter(f => f.id !== id));
      toast({
        title: "Sucesso",
        description: "Funcionário removido com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting funcionario:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o funcionário",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const getProfessores = useCallback(() => {
    return funcionarios.filter(f => 
      f.ativo && ['professor', 'personal'].includes(f.cargo)
    );
  }, [funcionarios]);

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  return {
    funcionarios,
    loading,
    addFuncionario,
    updateFuncionario,
    deleteFuncionario,
    getProfessores,
    refetch: fetchFuncionarios,
  };
}
