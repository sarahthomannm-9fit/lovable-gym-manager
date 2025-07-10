
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabasePayment {
  id: string;
  aluno_id: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  metodo_pagamento?: 'pix' | 'cartao' | 'dinheiro' | 'transferencia';
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
      
      // Cast the data to our expected types
      const typedPayments = (data || []).map(payment => ({
        ...payment,
        status: payment.status as 'pendente' | 'pago' | 'atrasado' | 'cancelado',
        metodo_pagamento: payment.metodo_pagamento as 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | undefined,
      })) as SupabasePayment[];
      
      setPayments(typedPayments);
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
      
      // Cast the returned data to our expected type
      const typedPayment = {
        ...data,
        status: data.status as 'pendente' | 'pago' | 'atrasado' | 'cancelado',
        metodo_pagamento: data.metodo_pagamento as 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | undefined,
      } as SupabasePayment;
      
      setPayments(prev => [typedPayment, ...prev]);
      toast({
        title: "Sucesso",
        description: "Pagamento adicionado com sucesso!",
      });
      
      return typedPayment;
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
      
      // Cast the returned data to our expected type
      const typedPayment = {
        ...data,
        status: data.status as 'pendente' | 'pago' | 'atrasado' | 'cancelado',
        metodo_pagamento: data.metodo_pagamento as 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | undefined,
      } as SupabasePayment;
      
      setPayments(prev => prev.map(p => p.id === id ? typedPayment : p));
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso!",
      });
      
      return typedPayment;
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
