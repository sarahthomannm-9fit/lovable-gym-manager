import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOperationalContext } from '@/hooks/useOperationalContext';

export interface Funcionario {
  id: string;
  organization_id: string;
  user_id: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: 'professor' | 'recepcionista' | 'personal' | 'nutricionista' | 'fisioterapeuta' | 'gerente' | 'agente_comercial';
  comissao_percentual: number | null;
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
  const { activeOrg } = useOperationalContext();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFuncionarios = useCallback(async () => {
    if (!activeOrg?.id) { setFuncionarios([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('organization_id', activeOrg.id)
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
  }, [toast, activeOrg?.id]);

  const addFuncionario = useCallback(async (funcionario: FuncionarioInput) => {
    if (!activeOrg?.id) throw new Error('Selecione uma organização.');
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert({ ...funcionario, organization_id: activeOrg.id, user_id: null })
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
  }, [toast, activeOrg?.id]);

  const updateFuncionario = useCallback(async (id: string, updates: Partial<FuncionarioInput>) => {
    if (!activeOrg?.id) throw new Error('Selecione uma organização.');
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', activeOrg.id)
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
  }, [toast, activeOrg?.id]);

  const deleteFuncionario = useCallback(async (id: string) => {
    return updateFuncionario(id, { ativo: false });
  }, [updateFuncionario]);

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

