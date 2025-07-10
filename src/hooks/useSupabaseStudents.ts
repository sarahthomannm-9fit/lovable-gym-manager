
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseStudent {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  plano_id?: string;
  data_matricula?: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  valor_mensalidade?: number;
  forma_pagamento?: 'pix' | 'cartao' | 'dinheiro' | 'transferencia';
  contato_emergencia?: string;
  observacoes_medicas?: string;
  created_at?: string;
  updated_at?: string;
}

export function useSupabaseStudents() {
  const [students, setStudents] = useState<SupabaseStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast the data to our expected types
      const typedStudents = (data || []).map(student => ({
        ...student,
        status: student.status as 'ativo' | 'inativo' | 'suspenso',
        forma_pagamento: student.forma_pagamento as 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | undefined,
      })) as SupabaseStudent[];
      
      setStudents(typedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os alunos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData: Omit<SupabaseStudent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('alunos')
        .insert([studentData])
        .select()
        .single();

      if (error) throw error;
      
      // Cast the returned data to our expected type
      const typedStudent = {
        ...data,
        status: data.status as 'ativo' | 'inativo' | 'suspenso',
        forma_pagamento: data.forma_pagamento as 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | undefined,
      } as SupabaseStudent;
      
      setStudents(prev => [typedStudent, ...prev]);
      toast({
        title: "Sucesso",
        description: "Aluno adicionado com sucesso!",
      });
      
      return typedStudent;
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o aluno",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<SupabaseStudent>) => {
    try {
      const { data, error } = await supabase
        .from('alunos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Cast the returned data to our expected type
      const typedStudent = {
        ...data,
        status: data.status as 'ativo' | 'inativo' | 'suspenso',
        forma_pagamento: data.forma_pagamento as 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | undefined,
      } as SupabaseStudent;
      
      setStudents(prev => prev.map(s => s.id === id ? typedStudent : s));
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso!",
      });
      
      return typedStudent;
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o aluno",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setStudents(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Sucesso",
        description: "Aluno removido com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o aluno",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    refetch: fetchStudents
  };
}
