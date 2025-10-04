import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['alunos']['Row'];
type StudentInsert = Database['public']['Tables']['alunos']['Insert'];

export function useOptimizedStudents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch with optimized caching
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Student[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });

  // Add student mutation
  const addStudent = useMutation({
    mutationFn: async (student: StudentInsert) => {
      const { data, error } = await supabase
        .from('alunos')
        .insert(student)
        .select()
        .single();
      
      if (error) throw error;
      return data as Student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Aluno cadastrado',
        description: 'Aluno adicionado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update student mutation
  const updateStudent = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Student> }) => {
      const { data, error } = await supabase
        .from('alunos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Aluno atualizado',
        description: 'Dados atualizados com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete student mutation
  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Aluno removido',
        description: 'Aluno excluído com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    students,
    isLoading,
    error,
    addStudent: addStudent.mutateAsync,
    updateStudent: updateStudent.mutateAsync,
    deleteStudent: deleteStudent.mutateAsync,
    isAdding: addStudent.isPending,
    isUpdating: updateStudent.isPending,
    isDeleting: deleteStudent.isPending,
  };
}