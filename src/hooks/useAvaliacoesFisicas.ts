import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AvaliacaoFisica {
  id: string;
  aluno_id: string | null;
  avaliador_id: string | null;
  data_avaliacao: string;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  percentual_gordura: number | null;
  massa_muscular: number | null;
  massa_ossea: number | null;
  agua_corporal: number | null;
  circunferencia_pescoco: number | null;
  circunferencia_peitoral: number | null;
  circunferencia_cintura: number | null;
  circunferencia_quadril: number | null;
  circunferencia_braco_direito: number | null;
  circunferencia_braco_esquerdo: number | null;
  circunferencia_coxa_direita: number | null;
  circunferencia_coxa_esquerda: number | null;
  circunferencia_panturrilha_direita: number | null;
  circunferencia_panturrilha_esquerda: number | null;
  dobra_triceps: number | null;
  dobra_biceps: number | null;
  dobra_subescapular: number | null;
  dobra_suprailiaca: number | null;
  dobra_abdominal: number | null;
  dobra_coxa: number | null;
  dobra_panturrilha: number | null;
  teste_flexibilidade: Record<string, any>;
  teste_forca: Record<string, any>;
  teste_resistencia: Record<string, any>;
  observacoes: string | null;
  metas: any[];
  proxima_avaliacao: string | null;
  created_at: string;
  updated_at: string;
}

export type AvaliacaoFisicaInput = Omit<AvaliacaoFisica, 'id' | 'imc' | 'created_at' | 'updated_at'>;

export function useAvaliacoesFisicas() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFisica[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAvaliacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('avaliacoes_fisicas')
        .select('*')
        .order('data_avaliacao', { ascending: false });

      if (error) throw error;
      setAvaliacoes((data || []) as AvaliacaoFisica[]);
    } catch (error) {
      console.error('Error fetching avaliacoes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as avaliações físicas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addAvaliacao = useCallback(async (avaliacao: AvaliacaoFisicaInput) => {
    try {
      const { data, error } = await supabase
        .from('avaliacoes_fisicas')
        .insert(avaliacao)
        .select()
        .single();

      if (error) throw error;

      setAvaliacoes(prev => [data as AvaliacaoFisica, ...prev]);
      toast({
        title: "Sucesso",
        description: "Avaliação física registrada com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error adding avaliacao:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a avaliação",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const updateAvaliacao = useCallback(async (id: string, updates: Partial<AvaliacaoFisicaInput>) => {
    try {
      const { data, error } = await supabase
        .from('avaliacoes_fisicas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAvaliacoes(prev => 
        prev.map(a => a.id === id ? (data as AvaliacaoFisica) : a)
      );
      toast({
        title: "Sucesso",
        description: "Avaliação atualizada com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error updating avaliacao:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a avaliação",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const deleteAvaliacao = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('avaliacoes_fisicas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAvaliacoes(prev => prev.filter(a => a.id !== id));
      toast({
        title: "Sucesso",
        description: "Avaliação removida com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting avaliacao:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a avaliação",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const getAvaliacoesByAluno = useCallback((alunoId: string) => {
    return avaliacoes.filter(a => a.aluno_id === alunoId);
  }, [avaliacoes]);

  const getUltimaAvaliacao = useCallback((alunoId: string) => {
    const avaliacoesAluno = getAvaliacoesByAluno(alunoId);
    return avaliacoesAluno[0] || null;
  }, [getAvaliacoesByAluno]);

  useEffect(() => {
    fetchAvaliacoes();
  }, [fetchAvaliacoes]);

  return {
    avaliacoes,
    loading,
    addAvaliacao,
    updateAvaliacao,
    deleteAvaliacao,
    getAvaliacoesByAluno,
    getUltimaAvaliacao,
    refetch: fetchAvaliacoes,
  };
}
