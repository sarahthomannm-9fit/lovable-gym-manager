
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabasePayment {
  id: string;
  aluno_id: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status?: string;
  metodo_pagamento?: string;
  referencia_mes: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useSupabasePayments() {
  const [payments, setPayments] = useState<SupabasePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pagamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (paymentData: Omit<SupabasePayment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;
      
      setPayments(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Pagamento adicionado com sucesso!",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o pagamento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePayment = async (id: string, updates: Partial<SupabasePayment>) => {
    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPayments(prev => prev.map(p => p.id === id ? data : p));
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso!",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pagamento",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return {
    payments,
    loading,
    addPayment,
    updatePayment,
    refetch: fetchPayments
  };
}
