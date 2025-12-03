import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Assinatura {
  id: string;
  aluno_id: string;
  plano_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: 'ativa' | 'cancelada' | 'pausada' | 'pendente' | 'expirada';
  data_inicio: string;
  data_fim: string | null;
  data_proxima_cobranca: string | null;
  valor_recorrente: number | null;
  metodo_pagamento: string | null;
  created_at: string;
  updated_at: string;
}

type AssinaturaInput = Omit<Assinatura, 'id' | 'created_at' | 'updated_at'>;

export function useAssinaturas() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssinaturas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assinaturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssinaturas((data || []) as Assinatura[]);
    } catch (error) {
      console.error('Error fetching assinaturas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as assinaturas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createAssinatura = useCallback(async (assinatura: AssinaturaInput) => {
    try {
      const { data, error } = await supabase
        .from('assinaturas')
        .insert(assinatura)
        .select()
        .single();

      if (error) throw error;

      setAssinaturas(prev => [data as Assinatura, ...prev]);
      toast({
        title: "Sucesso",
        description: "Assinatura criada com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error creating assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a assinatura",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const updateAssinatura = useCallback(async (id: string, updates: Partial<AssinaturaInput>) => {
    try {
      const { data, error } = await supabase
        .from('assinaturas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAssinaturas(prev => 
        prev.map(a => a.id === id ? (data as Assinatura) : a)
      );
      toast({
        title: "Sucesso",
        description: "Assinatura atualizada com sucesso!",
      });
      return data;
    } catch (error) {
      console.error('Error updating assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a assinatura",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const cancelarAssinatura = useCallback(async (id: string) => {
    return updateAssinatura(id, { status: 'cancelada' });
  }, [updateAssinatura]);

  const getAssinaturaAluno = useCallback((alunoId: string) => {
    return assinaturas.find(a => a.aluno_id === alunoId && a.status === 'ativa');
  }, [assinaturas]);

  const getAssinaturasAtivas = useCallback(() => {
    return assinaturas.filter(a => a.status === 'ativa');
  }, [assinaturas]);

  useEffect(() => {
    fetchAssinaturas();
  }, [fetchAssinaturas]);

  return {
    assinaturas,
    loading,
    createAssinatura,
    updateAssinatura,
    cancelarAssinatura,
    getAssinaturaAluno,
    getAssinaturasAtivas,
    refetch: fetchAssinaturas,
  };
}
