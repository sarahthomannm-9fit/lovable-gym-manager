import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SKU {
  id: string;
  nome: string;
  descricao?: string | null;
  tipo: string;
  preco: number;
  recorrencia: string;
  capacidade?: number | null;
  entregas?: any;
  beneficios?: any;
  modulos_liberados?: string[] | null;
  ativo: boolean;
  plano_id?: string | null;
  created_at: string;
  updated_at: string;
}

export function useSupabaseSKUs() {
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSKUs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('skus')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSKUs((data || []) as SKU[]);
    } catch (error) {
      console.error('Error fetching SKUs:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar o catálogo', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addSKU = async (skuData: Omit<SKU, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase.from('skus').insert([skuData]).select().single();
      if (error) throw error;
      const newSku = data as SKU;
      setSKUs(prev => [newSku, ...prev]);
      toast({ title: 'Sucesso', description: 'SKU adicionado com sucesso!' });
      return newSku;
    } catch (error) {
      console.error('Error adding SKU:', error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar o SKU', variant: 'destructive' });
      throw error;
    }
  };

  const updateSKU = async (id: string, updates: Partial<SKU>) => {
    try {
      const { data, error } = await supabase.from('skus').update(updates).eq('id', id).select().single();
      if (error) throw error;
      const updated = data as SKU;
      setSKUs(prev => prev.map(s => s.id === id ? updated : s));
      toast({ title: 'Sucesso', description: 'SKU atualizado!' });
      return updated;
    } catch (error) {
      console.error('Error updating SKU:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o SKU', variant: 'destructive' });
      throw error;
    }
  };

  const deleteSKU = async (id: string) => {
    try {
      const { error } = await supabase.from('skus').delete().eq('id', id);
      if (error) throw error;
      setSKUs(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Sucesso', description: 'SKU removido!' });
    } catch (error) {
      console.error('Error deleting SKU:', error);
      toast({ title: 'Erro', description: 'Não foi possível remover o SKU', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => { fetchSKUs(); }, []);

  return { skus, loading, addSKU, updateSKU, deleteSKU, refetch: fetchSKUs };
}
