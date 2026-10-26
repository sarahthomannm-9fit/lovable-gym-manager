import { useOperationalContext } from './useOperationalContext';
import { useTenantGuard } from './useTenantGuard';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseCheckIn {
  id: string;
  aluno_id: string;
  data_checkin?: string;
  horario_entrada?: string;
  horario_saida?: string;
  created_at?: string;
}

export function useSupabaseCheckIns() {
  const [checkIns, setCheckIns] = useState<SupabaseCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const {activeOrg,isAdmin}=useOperationalContext();
  const {requireOrganization,requireStudent}=useTenantGuard();
  const [loadError,setLoadError]=useState('');

  const fetchCheckIns = async () => {
    try {
      setLoading(true);setLoadError('');
      if(!activeOrg&&!isAdmin){setCheckIns([]);return;}
      let query = supabase
        .from('checkins')
        .select('*,alunos!inner(organization_id)')
        .order('data_checkin', { ascending: false });
      if(activeOrg)query=query.eq('alunos.organization_id',activeOrg.id);
      const {data,error}=await query;

      if (error) throw error;
      setCheckIns(data || []);
    } catch (error) {
      setCheckIns([]);setLoadError((error as Error).message||'Falha ao carregar dados deste condomínio.');
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
      await requireStudent(checkInData.aluno_id);
      const { data, error } = await (supabase as any).rpc('record_daily_checkin', {
        p_aluno_id: checkInData.aluno_id,
        p_date: checkInData.data_checkin || null,
      });

      if (error) throw error;
      
      setCheckIns(prev => prev.some((row) => row.id === data.id) ? prev : [data, ...prev]);
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
      const current=checkIns.find(row=>row.id===id);
      await requireStudent(current?.aluno_id);
      if(updates.aluno_id&&updates.aluno_id!==current?.aluno_id)throw new Error('Não é permitido transferir este registro.');
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
    loadError,
    addCheckIn,
    updateCheckIn,
    refetch: fetchCheckIns
  };
}

