import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOperationalContext } from '@/hooks/useOperationalContext';

export interface SupabaseEquipment {
  id: string;
  organization_id?: string | null;
  localizacao?: string | null;
  marca?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  proxima_manutencao?: string | null;
  nome: string;
  tipo: string;
  status: string;
  data_aquisicao?: string;
  custo?: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useSupabaseEquipment() {
  const [equipment, setEquipment] = useState<SupabaseEquipment[]>([]);
  const [maintenanceEvents, setMaintenanceEvents] = useState<{ equipment_id: string; action: string; detail: string; occurred_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { activeOrg } = useOperationalContext();

  const fetchEquipment = async () => {
    if (!activeOrg?.id) { setEquipment([]); setMaintenanceEvents([]); setLoading(false); return; }
    const [equipmentResult, maintenanceResult] = await Promise.all([
      supabase.from('equipamentos').select('*').eq('organization_id', activeOrg.id).order('created_at', { ascending: false }),
      supabase.from('equipment_maintenance_events' as any).select('equipment_id,action,detail,occurred_at').eq('organization_id', activeOrg.id).order('occurred_at', { ascending: false }).limit(500),
    ]);
    const { data, error } = equipmentResult;

    if (error) {
      console.error('Error fetching equipment:', error);
    } else {
      setEquipment(data || []);
    }
    if (maintenanceResult.error) toast({ title: 'Erro', description: 'Falha ao carregar histórico de manutenção', variant: 'destructive' });
    else setMaintenanceEvents((maintenanceResult.data || []) as unknown as typeof maintenanceEvents);
    setLoading(false);
  };

  const addEquipment = async (item: Omit<SupabaseEquipment, 'id' | 'created_at' | 'updated_at'>) => {
    if (!activeOrg?.id) throw new Error('Selecione uma organização.');
    const { data, error } = await supabase
      .from('equipamentos')
      .insert({ ...item, organization_id: activeOrg.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao adicionar equipamento', variant: 'destructive' });
      throw error;
    }
    setEquipment(prev => [data, ...prev]);
    toast({ title: 'Sucesso', description: 'Equipamento adicionado!' });
    return data;
  };

  const updateEquipment = async (id: string, updates: Partial<SupabaseEquipment>) => {
    const { data, error } = await supabase
      .from('equipamentos')
      .update(updates)
      .eq('id', id).eq('organization_id', activeOrg?.id || '')
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar equipamento', variant: 'destructive' });
      throw error;
    }
    setEquipment(prev => prev.map(e => e.id === id ? data : e));
    toast({ title: 'Sucesso', description: 'Equipamento atualizado!' });
    return data;
  };

  const deleteEquipment = async (id: string) => {
    const { error } = await supabase
      .from('equipamentos')
      .delete()
      .eq('id', id).eq('organization_id', activeOrg?.id || '');

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao remover equipamento', variant: 'destructive' });
      throw error;
    }
    setEquipment(prev => prev.filter(e => e.id !== id));
    toast({ title: 'Sucesso', description: 'Equipamento removido!' });
  };

  useEffect(() => { fetchEquipment(); }, [activeOrg?.id]);

  return { equipment, maintenanceEvents, loading, addEquipment, updateEquipment, deleteEquipment, refetch: fetchEquipment };
}

