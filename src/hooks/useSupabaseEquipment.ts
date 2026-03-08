import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseEquipment {
  id: string;
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEquipment = async () => {
    const { data, error } = await supabase
      .from('equipamentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching equipment:', error);
    } else {
      setEquipment(data || []);
    }
    setLoading(false);
  };

  const addEquipment = async (item: Omit<SupabaseEquipment, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('equipamentos')
      .insert(item)
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
      .eq('id', id)
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
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao remover equipamento', variant: 'destructive' });
      throw error;
    }
    setEquipment(prev => prev.filter(e => e.id !== id));
    toast({ title: 'Sucesso', description: 'Equipamento removido!' });
  };

  useEffect(() => { fetchEquipment(); }, []);

  return { equipment, loading, addEquipment, updateEquipment, deleteEquipment, refetch: fetchEquipment };
}
