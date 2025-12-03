import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FrequenciaAluno {
  id: string;
  aluno_id: string;
  data: string;
  horario_entrada: string;
  horario_saida: string | null;
  tipo_entrada: 'manual' | 'qrcode' | 'app' | 'biometria';
  duracao_minutos: number | null;
  created_at: string;
}

export function useFrequencia() {
  const [frequencias, setFrequencias] = useState<FrequenciaAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFrequencias = useCallback(async (dataInicio?: string, dataFim?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('frequencia_alunos')
        .select('*')
        .order('horario_entrada', { ascending: false });

      if (dataInicio) {
        query = query.gte('data', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data', dataFim);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFrequencias((data || []) as FrequenciaAluno[]);
    } catch (error) {
      console.error('Error fetching frequencias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a frequência",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const registrarEntrada = useCallback(async (
    alunoId: string, 
    tipoEntrada: 'manual' | 'qrcode' | 'app' | 'biometria' = 'manual'
  ) => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      // Verificar se já tem entrada ativa
      const { data: entradaAtiva } = await supabase
        .from('frequencia_alunos')
        .select('id')
        .eq('aluno_id', alunoId)
        .eq('data', hoje)
        .is('horario_saida', null)
        .maybeSingle();

      if (entradaAtiva) {
        toast({
          title: "Atenção",
          description: "Aluno já registrou entrada hoje",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('frequencia_alunos')
        .insert({
          aluno_id: alunoId,
          data: hoje,
          tipo_entrada: tipoEntrada,
        })
        .select()
        .single();

      if (error) throw error;

      setFrequencias(prev => [data as FrequenciaAluno, ...prev]);
      toast({
        title: "Entrada registrada",
        description: "Check-in realizado com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error registering entrada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar entrada",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const registrarSaida = useCallback(async (alunoId: string) => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      // Encontrar entrada ativa
      const { data: entradaAtiva, error: findError } = await supabase
        .from('frequencia_alunos')
        .select('id')
        .eq('aluno_id', alunoId)
        .eq('data', hoje)
        .is('horario_saida', null)
        .maybeSingle();

      if (findError) throw findError;
      
      if (!entradaAtiva) {
        toast({
          title: "Atenção",
          description: "Nenhuma entrada ativa encontrada",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('frequencia_alunos')
        .update({ horario_saida: new Date().toISOString() })
        .eq('id', entradaAtiva.id)
        .select()
        .single();

      if (error) throw error;

      setFrequencias(prev => 
        prev.map(f => f.id === entradaAtiva.id ? (data as FrequenciaAluno) : f)
      );
      
      toast({
        title: "Saída registrada",
        description: "Check-out realizado com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error registering saida:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar saída",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const getFrequenciaHoje = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];
    return frequencias.filter(f => f.data === hoje);
  }, [frequencias]);

  const getAlunosNaAcademia = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];
    return frequencias.filter(f => f.data === hoje && !f.horario_saida);
  }, [frequencias]);

  useEffect(() => {
    fetchFrequencias();
  }, [fetchFrequencias]);

  return {
    frequencias,
    loading,
    registrarEntrada,
    registrarSaida,
    getFrequenciaHoje,
    getAlunosNaAcademia,
    refetch: fetchFrequencias,
  };
}
