import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AulaExperimental {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  fonte: 'instagram' | 'facebook' | 'google' | 'indicacao' | 'site' | 'presencial' | 'whatsapp' | 'outro' | null;
  aula_id: string | null;
  data_agendada: string;
  horario_agendado: string | null;
  status: 'agendada' | 'confirmada' | 'realizada' | 'nao_compareceu' | 'convertida' | 'nao_convertida' | 'cancelada';
  notas: string | null;
  motivo_nao_conversao: string | null;
  data_conversao: string | null;
  plano_convertido_id: string | null;
  avaliacao_experiencia: number | null;
  feedback: string | null;
  atendido_por: string | null;
  created_at: string;
  updated_at: string;
}

export type AulaExperimentalInput = Omit<AulaExperimental, 'id' | 'created_at' | 'updated_at'>;

export function useAulasExperimentais() {
  const [aulasExperimentais, setAulasExperimentais] = useState<AulaExperimental[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAulasExperimentais = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('aulas_experimentais')
        .select('*')
        .order('data_agendada', { ascending: false });
      if (error) throw error;
      setAulasExperimentais((data || []) as AulaExperimental[]);
    } catch (error) {
      console.error('Error fetching aulas experimentais:', error);
      toast({ title: "Erro", description: "Não foi possível carregar as aulas experimentais", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addAulaExperimental = useCallback(async (aula: AulaExperimentalInput) => {
    try {
      const { data, error } = await supabase.from('aulas_experimentais').insert(aula).select().single();
      if (error) throw error;
      setAulasExperimentais(prev => [data as AulaExperimental, ...prev]);
      toast({ title: "Sucesso", description: "Aula experimental agendada com sucesso!" });
      return data;
    } catch (error) {
      console.error('Error adding aula experimental:', error);
      toast({ title: "Erro", description: "Não foi possível agendar a aula experimental", variant: "destructive" });
      throw error;
    }
  }, [toast]);

  const updateAulaExperimental = useCallback(async (id: string, updates: Partial<AulaExperimentalInput>) => {
    try {
      const { data, error } = await supabase.from('aulas_experimentais').update(updates).eq('id', id).select().single();
      if (error) throw error;
      setAulasExperimentais(prev => prev.map(a => a.id === id ? (data as AulaExperimental) : a));
      toast({ title: "Sucesso", description: "Aula experimental atualizada!" });
      return data;
    } catch (error) {
      console.error('Error updating aula experimental:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar a aula experimental", variant: "destructive" });
      throw error;
    }
  }, [toast]);

  // REAL conversion: creates student + first charge + updates experimental status
  const converterParaAluno = useCallback(async (id: string, planoId: string): Promise<{ alunoId: string }> => {
    try {
      // 1. Get the experimental class data
      const aula = aulasExperimentais.find(a => a.id === id);
      if (!aula) throw new Error('Aula experimental não encontrada');

      // 2. Get the selected plan
      const { data: plano, error: planoError } = await supabase
        .from('planos')
        .select('*')
        .eq('id', planoId)
        .single();
      if (planoError) throw planoError;

      // 3. Create the student record
      const { data: novoAluno, error: alunoError } = await supabase
        .from('alunos')
        .insert({
          nome: aula.nome,
          email: aula.email || `${aula.nome.toLowerCase().replace(/\s/g, '.')}@pendente.com`,
          telefone: aula.telefone,
          plano_id: planoId,
          tipo: 'presencial',
          status: 'ativo',
          categoria_aluno: 'fixo',
          valor_mensalidade: plano.preco,
          data_matricula: new Date().toISOString().split('T')[0],
          dia_pagamento: new Date().getDate(),
        })
        .select()
        .single();
      if (alunoError) throw alunoError;

      // 4. Create the first payment/charge
      const today = new Date();
      const dueDate = new Date(today.getFullYear(), today.getMonth(), Math.min(novoAluno.dia_pagamento || today.getDate(), 28));
      if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);

      await supabase.from('pagamentos').insert({
        aluno_id: novoAluno.id,
        valor: plano.preco,
        data_vencimento: dueDate.toISOString().split('T')[0],
        referencia_mes: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`,
        status: 'pendente',
      });

      // 5. Update experimental class status
      const { data: updatedAula, error: updateError } = await supabase
        .from('aulas_experimentais')
        .update({
          status: 'convertida',
          data_conversao: today.toISOString().split('T')[0],
          plano_convertido_id: planoId,
        })
        .eq('id', id)
        .select()
        .single();
      if (updateError) throw updateError;

      setAulasExperimentais(prev => prev.map(a => a.id === id ? (updatedAula as AulaExperimental) : a));
      
      toast({ title: "🎉 Lead convertido!", description: `${aula.nome} agora é aluno(a) com plano ${plano.nome}. Primeira cobrança gerada.` });
      return { alunoId: novoAluno.id };
    } catch (error) {
      console.error('Error converting aula experimental:', error);
      toast({ title: "Erro", description: "Não foi possível converter o lead", variant: "destructive" });
      throw error;
    }
  }, [toast, aulasExperimentais]);

  const marcarNaoCompareceu = useCallback(async (id: string) => updateAulaExperimental(id, { status: 'nao_compareceu' }), [updateAulaExperimental]);
  const marcarRealizada = useCallback(async (id: string) => updateAulaExperimental(id, { status: 'realizada' }), [updateAulaExperimental]);

  const getMetricasFunil = useCallback(() => {
    const total = aulasExperimentais.length;
    const agendadas = aulasExperimentais.filter(a => a.status === 'agendada').length;
    const confirmadas = aulasExperimentais.filter(a => a.status === 'confirmada').length;
    const realizadas = aulasExperimentais.filter(a => a.status === 'realizada').length;
    const convertidas = aulasExperimentais.filter(a => a.status === 'convertida').length;
    const naoCompareceram = aulasExperimentais.filter(a => a.status === 'nao_compareceu').length;
    const naoConvertidas = aulasExperimentais.filter(a => a.status === 'nao_convertida').length;
    const base = realizadas + convertidas + naoConvertidas;
    const taxaComparecimento = base + naoCompareceram > 0 ? (base / (base + naoCompareceram)) * 100 : 0;
    const taxaConversao = base > 0 ? (convertidas / base) * 100 : 0;
    return { total, agendadas, confirmadas, realizadas, convertidas, naoCompareceram, naoConvertidas, taxaComparecimento: Math.round(taxaComparecimento), taxaConversao: Math.round(taxaConversao) };
  }, [aulasExperimentais]);

  const getByFonte = useCallback(() => {
    const porFonte: Record<string, number> = {};
    aulasExperimentais.forEach(a => { const f = a.fonte || 'outro'; porFonte[f] = (porFonte[f] || 0) + 1; });
    return porFonte;
  }, [aulasExperimentais]);

  useEffect(() => { fetchAulasExperimentais(); }, [fetchAulasExperimentais]);

  return { aulasExperimentais, loading, addAulaExperimental, updateAulaExperimental, converterParaAluno, marcarNaoCompareceu, marcarRealizada, getMetricasFunil, getByFonte, refetch: fetchAulasExperimentais };
}
