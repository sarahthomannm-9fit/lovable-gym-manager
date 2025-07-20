
import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseStudents, SupabaseStudent } from '@/hooks/useSupabaseStudents';
import { useSupabasePayments, SupabasePayment } from '@/hooks/useSupabasePayments';
import { useSupabaseCheckIns, SupabaseCheckIn } from '@/hooks/useSupabaseCheckIns';
import { useSupabasePlans, SupabasePlan } from '@/hooks/useSupabasePlans';
import { useSupabaseClasses, SupabaseClass } from '@/hooks/useSupabaseClasses';
import { useSupabasePlanHistory, SupabasePlanHistory } from '@/hooks/useSupabasePlanHistory';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useBusinessRules } from '@/hooks/useBusinessRules';

interface SupabaseGymDataContextType {
  // Students
  students: SupabaseStudent[];
  studentsLoading: boolean;
  addStudent: (student: Omit<SupabaseStudent, 'id' | 'created_at' | 'updated_at'>) => Promise<SupabaseStudent>;
  updateStudent: (id: string, student: Partial<SupabaseStudent>) => Promise<SupabaseStudent>;
  deleteStudent: (id: string) => Promise<void>;
  refetchStudents: () => Promise<void>;

  // Payments
  payments: SupabasePayment[];
  paymentsLoading: boolean;
  addPayment: (payment: Omit<SupabasePayment, 'id' | 'created_at' | 'updated_at'>) => Promise<SupabasePayment>;
  updatePayment: (id: string, payment: Partial<SupabasePayment>) => Promise<SupabasePayment>;
  refetchPayments: () => Promise<void>;

  // Check-ins
  checkIns: SupabaseCheckIn[];
  checkInsLoading: boolean;
  addCheckIn: (checkIn: Omit<SupabaseCheckIn, 'id' | 'created_at'>) => Promise<SupabaseCheckIn>;
  updateCheckIn: (id: string, checkIn: Partial<SupabaseCheckIn>) => Promise<SupabaseCheckIn>;
  refetchCheckIns: () => Promise<void>;

  // Plans
  plans: SupabasePlan[];
  plansLoading: boolean;
  addPlan: (planData: Omit<SupabasePlan, 'id' | 'created_at' | 'updated_at'>) => Promise<SupabasePlan>;
  updatePlan: (id: string, planData: Partial<SupabasePlan>) => Promise<SupabasePlan>;
  deletePlan: (id: string) => Promise<void>;
  refetchPlans: () => Promise<void>;

  // Classes
  classes: SupabaseClass[];
  classesLoading: boolean;
  addClass: (classData: Omit<SupabaseClass, 'id' | 'created_at' | 'updated_at'>) => Promise<SupabaseClass>;
  updateClass: (id: string, updates: Partial<SupabaseClass>) => Promise<SupabaseClass>;
  deleteClass: (id: string) => Promise<void>;
  refetchClasses: () => Promise<void>;

  // Plan History
  planHistory: SupabasePlanHistory[];
  planHistoryLoading: boolean;
  addPlanHistory: (historyData: Omit<SupabasePlanHistory, 'id' | 'created_at' | 'updated_at'>) => Promise<SupabasePlanHistory>;
  updatePlanHistory: (id: string, updates: Partial<SupabasePlanHistory>) => Promise<SupabasePlanHistory>;
  refetchPlanHistory: (studentId?: string) => Promise<void>;

  // Activity Logger
  activities: any[];
  logStudentAction: (action: 'create' | 'update' | 'delete', studentId: string, studentName: string) => void;
  logPaymentAction: (action: 'create' | 'update', paymentId: string, studentName: string, amount: number) => void;
  logPlanAction: (action: 'create' | 'update' | 'delete', planId: string, planName: string) => void;
  logCheckInAction: (studentName: string, checkInId: string) => void;
  logClassAction: (action: 'create' | 'update' | 'delete', classId: string, className: string) => void;

  // Business Rules
  checkBusinessRules: {
    student: (student: Partial<SupabaseStudent>) => boolean;
    payment: (payment: Partial<SupabasePayment>) => boolean;
    plan: (plan: Partial<SupabasePlan>) => boolean;
  };
}

const SupabaseGymDataContext = createContext<SupabaseGymDataContextType | undefined>(undefined);

export function SupabaseGymDataProvider({ children }: { children: ReactNode }) {
  const studentsHook = useSupabaseStudents();
  const paymentsHook = useSupabasePayments();
  const checkInsHook = useSupabaseCheckIns();
  const plansHook = useSupabasePlans();
  const classesHook = useSupabaseClasses();
  const planHistoryHook = useSupabasePlanHistory();
  const activityLogger = useActivityLogger();
  const businessRules = useBusinessRules();

  // Wrap the original functions to include logging and validation
  const enhancedAddStudent = async (student: Omit<SupabaseStudent, 'id' | 'created_at' | 'updated_at'>) => {
    if (!businessRules.checkBusinessRules.student(student)) {
      throw new Error('Validação falhou');
    }
    
    const result = await studentsHook.addStudent(student);
    activityLogger.logStudentAction('create', result.id, result.nome);
    return result;
  };

  const enhancedUpdateStudent = async (id: string, student: Partial<SupabaseStudent>) => {
    if (!businessRules.checkBusinessRules.student(student)) {
      throw new Error('Validação falhou');
    }
    
    const result = await studentsHook.updateStudent(id, student);
    activityLogger.logStudentAction('update', result.id, result.nome);
    return result;
  };

  const enhancedDeleteStudent = async (id: string) => {
    const student = studentsHook.students.find(s => s.id === id);
    await studentsHook.deleteStudent(id);
    if (student) {
      activityLogger.logStudentAction('delete', id, student.nome);
    }
  };

  const enhancedAddPayment = async (payment: Omit<SupabasePayment, 'id' | 'created_at' | 'updated_at'>) => {
    if (!businessRules.checkBusinessRules.payment(payment)) {
      throw new Error('Validação falhou');
    }
    
    const result = await paymentsHook.addPayment(payment);
    const student = studentsHook.students.find(s => s.id === payment.aluno_id);
    if (student) {
      activityLogger.logPaymentAction('create', result.id, student.nome, result.valor);
    }
    return result;
  };

  const enhancedUpdatePayment = async (id: string, payment: Partial<SupabasePayment>) => {
    if (!businessRules.checkBusinessRules.payment(payment)) {
      throw new Error('Validação falhou');
    }
    
    const result = await paymentsHook.updatePayment(id, payment);
    const student = studentsHook.students.find(s => s.id === result.aluno_id);
    if (student) {
      activityLogger.logPaymentAction('update', result.id, student.nome, result.valor);
    }
    return result;
  };

  const enhancedAddCheckIn = async (checkIn: Omit<SupabaseCheckIn, 'id' | 'created_at'>) => {
    const result = await checkInsHook.addCheckIn(checkIn);
    const student = studentsHook.students.find(s => s.id === checkIn.aluno_id);
    if (student) {
      activityLogger.logCheckInAction(student.nome, result.id);
    }
    return result;
  };

  const enhancedAddPlan = async (planData: Omit<SupabasePlan, 'id' | 'created_at' | 'updated_at'>) => {
    if (!businessRules.checkBusinessRules.plan(planData)) {
      throw new Error('Validação falhou');
    }
    
    const result = await plansHook.addPlan(planData);
    activityLogger.logPlanAction('create', result.id, result.nome);
    return result;
  };

  const enhancedUpdatePlan = async (id: string, planData: Partial<SupabasePlan>) => {
    if (!businessRules.checkBusinessRules.plan(planData)) {
      throw new Error('Validação falhou');
    }
    
    const result = await plansHook.updatePlan(id, planData);
    activityLogger.logPlanAction('update', result.id, result.nome);
    return result;
  };

  const enhancedDeletePlan = async (id: string) => {
    const plan = plansHook.plans.find(p => p.id === id);
    await plansHook.deletePlan(id);
    if (plan) {
      activityLogger.logPlanAction('delete', id, plan.nome);
    }
  };

  const enhancedAddClass = async (classData: Omit<SupabaseClass, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await classesHook.addClass(classData);
    activityLogger.logClassAction('create', result.id, result.nome);
    return result;
  };

  const enhancedUpdateClass = async (id: string, updates: Partial<SupabaseClass>) => {
    const result = await classesHook.updateClass(id, updates);
    activityLogger.logClassAction('update', result.id, result.nome);
    return result;
  };

  const enhancedDeleteClass = async (id: string) => {
    const classItem = classesHook.classes.find(c => c.id === id);
    await classesHook.deleteClass(id);
    if (classItem) {
      activityLogger.logClassAction('delete', id, classItem.nome);
    }
  };

  const value: SupabaseGymDataContextType = {
    // Students
    students: studentsHook.students,
    studentsLoading: studentsHook.loading,
    addStudent: enhancedAddStudent,
    updateStudent: enhancedUpdateStudent,
    deleteStudent: enhancedDeleteStudent,
    refetchStudents: studentsHook.refetch,

    // Payments
    payments: paymentsHook.payments,
    paymentsLoading: paymentsHook.loading,
    addPayment: enhancedAddPayment,
    updatePayment: enhancedUpdatePayment,
    refetchPayments: paymentsHook.refetch,

    // Check-ins
    checkIns: checkInsHook.checkIns,
    checkInsLoading: checkInsHook.loading,
    addCheckIn: enhancedAddCheckIn,
    updateCheckIn: checkInsHook.updateCheckIn,
    refetchCheckIns: checkInsHook.refetch,

    // Plans
    plans: plansHook.plans,
    plansLoading: plansHook.loading,
    addPlan: enhancedAddPlan,
    updatePlan: enhancedUpdatePlan,
    deletePlan: enhancedDeletePlan,
    refetchPlans: plansHook.refetch,

    // Classes
    classes: classesHook.classes,
    classesLoading: classesHook.loading,
    addClass: enhancedAddClass,
    updateClass: enhancedUpdateClass,
    deleteClass: enhancedDeleteClass,
    refetchClasses: classesHook.refetch,

    // Plan History
    planHistory: planHistoryHook.planHistory,
    planHistoryLoading: planHistoryHook.loading,
    addPlanHistory: planHistoryHook.addPlanHistory,
    updatePlanHistory: planHistoryHook.updatePlanHistory,
    refetchPlanHistory: planHistoryHook.refetch,

    // Activity Logger
    activities: activityLogger.activities,
    logStudentAction: activityLogger.logStudentAction,
    logPaymentAction: activityLogger.logPaymentAction,
    logPlanAction: activityLogger.logPlanAction,
    logCheckInAction: activityLogger.logCheckInAction,
    logClassAction: activityLogger.logClassAction,

    // Business Rules
    checkBusinessRules: businessRules.checkBusinessRules,
  };

  return (
    <SupabaseGymDataContext.Provider value={value}>
      {children}
    </SupabaseGymDataContext.Provider>
  );
}

export function useSupabaseGymData() {
  const context = useContext(SupabaseGymDataContext);
  if (context === undefined) {
    throw new Error('useSupabaseGymData must be used within a SupabaseGymDataProvider');
  }
  return context;
}
