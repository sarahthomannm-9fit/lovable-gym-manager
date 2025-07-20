
import { useToast } from '@/hooks/use-toast';
import { SupabaseStudent } from '@/hooks/useSupabaseStudents';
import { SupabasePayment } from '@/hooks/useSupabasePayments';
import { SupabasePlan } from '@/hooks/useSupabasePlans';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function useBusinessRules() {
  const { toast } = useToast();

  const validateStudent = (student: Partial<SupabaseStudent>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações obrigatórias
    if (!student.nome?.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!student.email?.trim()) {
      errors.push('Email é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      errors.push('Email deve ter um formato válido');
    }

    if (student.telefone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(student.telefone)) {
      warnings.push('Telefone deve seguir o formato (XX) XXXXX-XXXX');
    }

    // Validação de idade
    if (student.data_nascimento) {
      const birthDate = new Date(student.data_nascimento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 14) {
        warnings.push('Aluno menor de 14 anos precisa de autorização responsável');
      }
      
      if (age > 80) {
        warnings.push('Aluno acima de 80 anos precisa de avaliação médica');
      }
    }

    // Validação de valor de mensalidade
    if (student.valor_mensalidade && student.valor_mensalidade <= 0) {
      errors.push('Valor da mensalidade deve ser maior que zero');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const validatePayment = (payment: Partial<SupabasePayment>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações obrigatórias
    if (!payment.aluno_id) {
      errors.push('Aluno é obrigatório');
    }

    if (!payment.valor || payment.valor <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!payment.data_vencimento) {
      errors.push('Data de vencimento é obrigatória');
    }

    if (!payment.referencia_mes) {
      errors.push('Mês de referência é obrigatório');
    }

    // Validação de datas
    if (payment.data_vencimento && payment.data_pagamento) {
      const vencimento = new Date(payment.data_vencimento);
      const pagamento = new Date(payment.data_pagamento);
      
      if (pagamento < vencimento) {
        // Pagamento antecipado
        warnings.push('Pagamento realizado antes do vencimento');
      } else if (pagamento.getTime() - vencimento.getTime() > 7 * 24 * 60 * 60 * 1000) {
        // Pagamento com mais de 7 dias de atraso
        warnings.push('Pagamento realizado com atraso superior a 7 dias');
      }
    }

    // Validação de valor muito alto
    if (payment.valor && payment.valor > 1000) {
      warnings.push('Valor muito alto para mensalidade - verifique se está correto');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const validatePlan = (plan: Partial<SupabasePlan>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações obrigatórias
    if (!plan.nome?.trim()) {
      errors.push('Nome do plano é obrigatório');
    }

    if (!plan.preco || plan.preco <= 0) {
      errors.push('Preço deve ser maior que zero');
    }

    if (!plan.duracao_meses || plan.duracao_meses <= 0) {
      errors.push('Duração em meses deve ser maior que zero');
    }

    // Validações de negócio
    if (plan.preco && plan.preco < 50) {
      warnings.push('Preço muito baixo - verifique se está correto');
    }

    if (plan.preco && plan.preco > 500) {
      warnings.push('Preço muito alto - verifique se está correto');
    }

    if (plan.duracao_meses && plan.duracao_meses > 24) {
      warnings.push('Duração muito longa - considere planos anuais');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const showValidationResults = (result: ValidationResult, entity: string) => {
    if (!result.isValid) {
      toast({
        title: `Erro na validação ${entity}`,
        description: result.errors.join(', '),
        variant: "destructive",
      });
      return false;
    }

    if (result.warnings.length > 0) {
      toast({
        title: `Atenção - ${entity}`,
        description: result.warnings.join(', '),
        variant: "default",
      });
    }

    return true;
  };

  const checkBusinessRules = {
    student: (student: Partial<SupabaseStudent>) => {
      const result = validateStudent(student);
      return showValidationResults(result, 'do aluno');
    },
    
    payment: (payment: Partial<SupabasePayment>) => {
      const result = validatePayment(payment);
      return showValidationResults(result, 'do pagamento');
    },
    
    plan: (plan: Partial<SupabasePlan>) => {
      const result = validatePlan(plan);
      return showValidationResults(result, 'do plano');
    }
  };

  return {
    validateStudent,
    validatePayment,
    validatePlan,
    checkBusinessRules
  };
}
