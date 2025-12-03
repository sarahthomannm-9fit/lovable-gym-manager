import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AulaInscrito {
  id: string;
  aula_id: string;
  aluno_id: string;
  status: 'inscrito' | 'presente' | 'faltou' | 'lista_espera' | 'cancelado';
  posicao_lista_espera: number | null;
  data_inscricao: string;
  created_at: string;
}

export function useAulasInscritos() {
  const [inscritos, setInscritos] = useState<AulaInscrito[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInscritos = useCallback(async (aulaId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('aulas_inscritos')
        .select('*')
        .order('data_inscricao', { ascending: false });

      if (aulaId) {
        query = query.eq('aula_id', aulaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInscritos((data || []) as AulaInscrito[]);
    } catch (error) {
      console.error('Error fetching inscritos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os inscritos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const inscreverAluno = useCallback(async (
    aulaId: string, 
    alunoId: string,
    capacidadeMaxima: number
  ) => {
    try {
      // Verificar se já está inscrito
      const { data: existente } = await supabase
        .from('aulas_inscritos')
        .select('id, status')
        .eq('aula_id', aulaId)
        .eq('aluno_id', alunoId)
        .maybeSingle();

      if (existente && existente.status !== 'cancelado') {
        toast({
          title: "Atenção",
          description: "Aluno já está inscrito nesta aula",
          variant: "destructive",
        });
        return null;
      }

      // Contar inscritos atuais
      const { count } = await supabase
        .from('aulas_inscritos')
        .select('id', { count: 'exact' })
        .eq('aula_id', aulaId)
        .in('status', ['inscrito', 'presente']);

      const vagasDisponiveis = capacidadeMaxima - (count || 0);
      const novoStatus = vagasDisponiveis > 0 ? 'inscrito' : 'lista_espera';

      const inscricaoData = {
        aula_id: aulaId,
        aluno_id: alunoId,
        status: novoStatus,
        posicao_lista_espera: novoStatus === 'lista_espera' ? (count || 0) + 1 - capacidadeMaxima : null,
      };

      let data;
      if (existente) {
        // Reativar inscrição cancelada
        const result = await supabase
          .from('aulas_inscritos')
          .update(inscricaoData)
          .eq('id', existente.id)
          .select()
          .single();
        if (result.error) throw result.error;
        data = result.data;
      } else {
        const result = await supabase
          .from('aulas_inscritos')
          .insert(inscricaoData)
          .select()
          .single();
        if (result.error) throw result.error;
        data = result.data;
      }

      setInscritos(prev => {
        const filtered = prev.filter(i => i.id !== data.id);
        return [...filtered, data as AulaInscrito];
      });

      toast({
        title: novoStatus === 'inscrito' ? "Inscrito!" : "Lista de espera",
        description: novoStatus === 'inscrito' 
          ? "Aluno inscrito com sucesso!" 
          : "Aluno adicionado à lista de espera",
      });
      return data;
    } catch (error) {
      console.error('Error inscribing aluno:', error);
      toast({
        title: "Erro",
        description: "Não foi possível inscrever o aluno",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const cancelarInscricao = useCallback(async (inscricaoId: string) => {
    try {
      const { data, error } = await supabase
        .from('aulas_inscritos')
        .update({ status: 'cancelado' })
        .eq('id', inscricaoId)
        .select()
        .single();

      if (error) throw error;

      setInscritos(prev => 
        prev.map(i => i.id === inscricaoId ? (data as AulaInscrito) : i)
      );
      
      toast({
        title: "Cancelado",
        description: "Inscrição cancelada com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error canceling inscricao:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a inscrição",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const marcarPresenca = useCallback(async (inscricaoId: string) => {
    try {
      const { data, error } = await supabase
        .from('aulas_inscritos')
        .update({ status: 'presente' })
        .eq('id', inscricaoId)
        .select()
        .single();

      if (error) throw error;

      setInscritos(prev => 
        prev.map(i => i.id === inscricaoId ? (data as AulaInscrito) : i)
      );
      
      toast({
        title: "Presença confirmada",
        description: "Presença marcada com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error marking presenca:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar presença",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const marcarFalta = useCallback(async (inscricaoId: string) => {
    try {
      const { data, error } = await supabase
        .from('aulas_inscritos')
        .update({ status: 'faltou' })
        .eq('id', inscricaoId)
        .select()
        .single();

      if (error) throw error;

      setInscritos(prev => 
        prev.map(i => i.id === inscricaoId ? (data as AulaInscrito) : i)
      );
      
      toast({
        title: "Falta registrada",
        description: "Falta marcada para o aluno",
      });
      return data;
    } catch (error) {
      console.error('Error marking falta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar falta",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const getInscritosPorAula = useCallback((aulaId: string) => {
    return inscritos.filter(i => i.aula_id === aulaId && i.status !== 'cancelado');
  }, [inscritos]);

  const getListaEspera = useCallback((aulaId: string) => {
    return inscritos
      .filter(i => i.aula_id === aulaId && i.status === 'lista_espera')
      .sort((a, b) => (a.posicao_lista_espera || 0) - (b.posicao_lista_espera || 0));
  }, [inscritos]);

  useEffect(() => {
    fetchInscritos();
  }, [fetchInscritos]);

  return {
    inscritos,
    loading,
    inscreverAluno,
    cancelarInscricao,
    marcarPresenca,
    marcarFalta,
    getInscritosPorAula,
    getListaEspera,
    refetch: fetchInscritos,
  };
}
