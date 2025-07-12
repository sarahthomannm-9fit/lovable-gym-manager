
import { Student, Plan } from '@/types/gym';
import { SupabaseStudent } from '@/hooks/useSupabaseStudents';
import { SupabasePlan } from '@/hooks/useSupabasePlans';

// Convert Supabase student to old format for compatibility
export function convertSupabaseStudentToOld(supabaseStudent: SupabaseStudent): Student {
  return {
    id: parseInt(supabaseStudent.id.slice(-8), 16), // Convert UUID to number for compatibility
    name: supabaseStudent.nome,
    email: supabaseStudent.email,
    phone: supabaseStudent.telefone || '',
    plan: 'Mensal', // Default plan for now
    registrationDate: supabaseStudent.data_matricula || new Date().toISOString().split('T')[0],
    status: supabaseStudent.status as 'active' | 'inactive' | 'suspended',
    monthlyPayment: supabaseStudent.valor_mensalidade || 100,
    paymentStatus: 'up-to-date' as const,
    startDate: supabaseStudent.data_matricula,
    paymentMethod: supabaseStudent.forma_pagamento,
    emergencyContact: supabaseStudent.contato_emergencia,
    medicalInfo: supabaseStudent.observacoes_medicas,
    age: supabaseStudent.data_nascimento ? 
      new Date().getFullYear() - new Date(supabaseStudent.data_nascimento).getFullYear() : 
      undefined,
  };
}

// Convert old student format to Supabase format
export function convertOldStudentToSupabase(oldStudent: Omit<Student, 'id'>): Omit<SupabaseStudent, 'id' | 'created_at' | 'updated_at'> {
  return {
    nome: oldStudent.name,
    email: oldStudent.email,
    telefone: oldStudent.phone,
    data_matricula: oldStudent.registrationDate,
    status: oldStudent.status === 'active' ? 'ativo' : 
            oldStudent.status === 'inactive' ? 'inativo' : 'suspenso',
    valor_mensalidade: oldStudent.monthlyPayment,
    forma_pagamento: oldStudent.paymentMethod as 'pix' | 'cartao' | 'dinheiro' | 'transferencia' | undefined,
    contato_emergencia: oldStudent.emergencyContact,
    observacoes_medicas: oldStudent.medicalInfo,
  };
}

// Convert Supabase plan to old format for compatibility
export function convertSupabasePlanToOld(supabasePlan: SupabasePlan): Plan {
  return {
    id: parseInt(supabasePlan.id.slice(-8), 16), // Convert UUID to number for compatibility
    name: supabasePlan.nome,
    price: supabasePlan.preco,
    duration: supabasePlan.duracao_meses,
    benefits: supabasePlan.beneficios || [],
    active: supabasePlan.ativo ?? true,
  };
}

// Convert old plan format to Supabase format
export function convertOldPlanToSupabase(oldPlan: Omit<Plan, 'id'>): Omit<SupabasePlan, 'id' | 'created_at' | 'updated_at'> {
  return {
    nome: oldPlan.name,
    preco: oldPlan.price,
    duracao_meses: oldPlan.duration,
    beneficios: oldPlan.benefits,
    ativo: oldPlan.active,
  };
}
