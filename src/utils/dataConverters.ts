
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
    registrationDate: supabaseStudent.created_at ? new Date(supabaseStudent.created_at).toISOString().split('T')[0] : '',
    status: 'active', // Default status since simplified schema doesn't have status
    monthlyPayment: 0, // Default value since simplified schema doesn't have payment info
    paymentStatus: 'up-to-date', // Default status
    startDate: supabaseStudent.created_at ? new Date(supabaseStudent.created_at).toISOString().split('T')[0] : '',
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
    price: Number(supabasePlan.valor),
    duration: Math.round((supabasePlan.duracao_dias || 30) / 30), // Convert days to months
    benefits: [], // Default empty benefits since simplified schema doesn't store benefits
    active: true, // Default active status
  };
}

export function convertOldPlanToSupabase(oldPlan: Partial<Plan>): Partial<SupabasePlan> {
  return {
    nome: oldPlan.name || '',
    valor: oldPlan.price || 0,
    duracao_dias: (oldPlan.duration || 1) * 30, // Convert months to days
    tipo: 'mensal', // Default type
    quantidade_aulas: 0, // Default value
  };
}
