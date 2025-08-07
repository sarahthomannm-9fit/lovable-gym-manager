
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseClass {
  id: string;
  aluno_id?: string;
  plano_id?: string;
  data?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export function useSupabaseClasses() {
  const [classes, setClasses] = useState<SupabaseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('aulas')
        .select('*')
        .order('data', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as aulas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addClass = async (classData: Omit<SupabaseClass, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('aulas')
        .insert([classData])
        .select()
        .single();

      if (error) throw error;
      
      setClasses(prev => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Aula adicionada com sucesso!",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding class:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a aula",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateClass = async (id: string, updates: Partial<SupabaseClass>) => {
    try {
      const { data, error } = await supabase
        .from('aulas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setClasses(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso!",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a aula",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const { error } = await supabase
        .from('aulas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClasses(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Sucesso",
        description: "Aula removida com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a aula",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return {
    classes,
    loading,
    addClass,
    updateClass,
    deleteClass,
    refetch: fetchClasses
  };
}
