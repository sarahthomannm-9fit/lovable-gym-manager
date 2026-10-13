import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOperationalContext } from '@/hooks/useOperationalContext';

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
  organization_id?: string | null;
  aluno_convertido_id?: string | null;
}

export type AulaExperimentalInput = Omit<AulaExperimental, 'id' | 'created_at' | 'updated_at'>;

export function useAulasExperimentais() {
  const [aulasExperimentais, setAulasExperimentais] = useState<AulaExperimental[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { activeOrg } = useOperationalContext();

  const fetchAulasExperimentais = useCallback(async () => {
    try {
      setLoading(true);
      const query = supabase.from('aulas_experimentais').select('*').order('data_agendada', { ascending: false });
      const { data, error } = await (activeOrg ? query.eq('organization_id', activeOrg.id) : query);
      if (error) throw error;
      setAulasExperimentais((data || []) as AulaExperimental[]);
    } catch (error) {
      console.error('Error fetching aulas experimentais:', error);
      toast({ title: "Erro", description: "Não foi possível carregar as aulas experimentais", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, activeOrg?.id]);

  const addAulaExperimental = useCallback(async (aula: AulaExperimentalInput) => {
    try {
      if (!activeOrg) throw new Error('Selecione uma organização para agendar.');
      const { data, error } = await supabase.from('aulas_experimentais').insert({ ...aula, organization_id: activeOrg.id }).select().single();
      if (error) throw error;
      setAulasExperimentais(prev => [data as AulaExperimental, ...prev]);
      toast({ title: "Sucesso", description: "Aula experimental agendada com sucesso!" });
      return data;
    } catch (error) {
      console.error('Error adding aula experimental:', error);
      toast({ title: "Erro", description: "Não foi possível agendar a aula experimental", variant: "destructive" });
      throw error;
    }
  }, [toast, activeOrg?.id]);

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

  // The database transaction creates the student, charge and conversion together.
  const converterParaAluno = useCallback(async (id: string, planoId: string): Promise<{ alunoId: string }> => {
    try {
      const aula = aulasExperimentais.find(a => a.id === id);
      if (!aula) throw new Error('Aula experimental não encontrada');
      if (!activeOrg) throw new Error('Selecione a organização para converter.');
      const { data: alunoId, error } = await (supabase as any).rpc('convert_experimental_class', {
        p_experimental_id: id, p_plano_id: planoId, p_organization_id: activeOrg.id,
      });
      if (error) throw error;
      await fetchAulasExperimentais();
      toast({ title: 'Lead convertido', description: `${aula.nome} foi vinculado ao plano e a primeira cobrança ficou pendente.` });
      return { alunoId };
    } catch (error) {
      console.error('Error converting aula experimental:', error);
      toast({ title: "Erro", description: "Não foi possível converter o lead", variant: "destructive" });
      throw error;
    }
  }, [toast, aulasExperimentais, activeOrg?.id, fetchAulasExperimentais]);

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

