
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseCheckIn {
  id: string;
  aluno_id: string;
  data_checkin?: string;
  horario_entrada: string;
  horario_saida?: string;
  created_at?: string;
}

export function useSupabaseCheckIns() {
  const [checkIns, setCheckIns] = useState<SupabaseCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .order('horario_entrada', { ascending: false });

      if (error) throw error;
      setCheckIns(data || []);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os check-ins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCheckIn = async (checkInData: Omit<SupabaseCheckIn, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('checkins')
        .insert([checkInData])
        .select()
        .single();

      if (error) throw error;
      
      setCheckIns(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Check-in registrado com sucesso!",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding check-in:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o check-in",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCheckIn = async (id: string, updates: Partial<SupabaseCheckIn>) => {
    try {
      const { data, error } = await supabase
        .from('checkins')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCheckIns(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: "Sucesso",
        description: "Check-in atualizado com sucesso!",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating check-in:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o check-in",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCheckIns();
  }, []);

  return {
    checkIns,
    loading,
    addCheckIn,
    updateCheckIn,
    refetch: fetchCheckIns
  };
}
