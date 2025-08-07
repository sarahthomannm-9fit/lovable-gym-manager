
import { Student, Plan } from '@/types/gym';
import { SupabaseStudent } from '@/hooks/useSupabaseStudents';
import { SupabasePlan } from '@/hooks/useSupabasePlans';

export function convertSupabaseStudentToOld(supabaseStudent: SupabaseStudent): Student {
  return {
    id: parseInt(supabaseStudent.id.slice(-8), 16), // Convert UUID to number for UI compatibility
    name: supabaseStudent.nome,
    email: supabaseStudent.email || '',
    phone: supabaseStudent.telefone || '',
    plan: supabaseStudent.tipo || 'presencial',
    registrationDate: supabaseStudent.data_matricula || (supabaseStudent.created_at ? new Date(supabaseStudent.created_at).toISOString().split('T')[0] : ''),
    status: 'active', // Default status since simplified schema doesn't have status
    monthlyPayment: supabaseStudent.valor_mensalidade || 0,
    paymentStatus: 'up-to-date', // Default status
    startDate: supabaseStudent.data_matricula || (supabaseStudent.created_at ? new Date(supabaseStudent.created_at).toISOString().split('T')[0] : ''),
  };
}

export function convertOldStudentToSupabase(oldStudent: Partial<Student>): Partial<SupabaseStudent> {
  return {
    nome: oldStudent.name || '',
    email: oldStudent.email,
    telefone: oldStudent.phone,
    tipo: oldStudent.plan === 'consultoria' ? 'consultoria' : 'presencial',
  };
}

export function convertSupabasePlanToOld(supabasePlan: SupabasePlan): Plan {
  return {
    id: parseInt(supabasePlan.id.slice(-8), 16), // Convert UUID to number for UI compatibility
    name: supabasePlan.nome,
    price: Number(supabasePlan.valor || supabasePlan.preco || 0),
    duration: Math.round((supabasePlan.duracao_dias || 30) / 30), // Convert days to months
    benefits: supabasePlan.beneficios || [], // Use beneficios array if available
    active: supabasePlan.ativo ?? true, // Use ativo if available
  };
}

export function convertOldPlanToSupabase(oldPlan: Partial<Plan>): Partial<SupabasePlan> {
  return {
    nome: oldPlan.name || '',
    valor: oldPlan.price || 0,
    duracao_dias: (oldPlan.duration || 1) * 30, // Convert months to days
    tipo: 'mensal', // Default type
    quantidade_aulas: 0, // Default value
    beneficios: oldPlan.benefits || [],
    ativo: oldPlan.active ?? true,
  };
}
