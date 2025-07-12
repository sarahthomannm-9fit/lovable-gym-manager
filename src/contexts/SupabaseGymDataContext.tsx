
import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseStudents, SupabaseStudent } from '@/hooks/useSupabaseStudents';
import { useSupabasePayments, SupabasePayment } from '@/hooks/useSupabasePayments';
import { useSupabaseCheckIns, SupabaseCheckIn } from '@/hooks/useSupabaseCheckIns';
import { useSupabasePlans, SupabasePlan } from '@/hooks/useSupabasePlans';
import { useSupabaseClasses, SupabaseClass } from '@/hooks/useSupabaseClasses';
import { useSupabasePlanHistory, SupabasePlanHistory } from '@/hooks/useSupabasePlanHistory';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

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
}

const SupabaseGymDataContext = createContext<SupabaseGymDataContextType | undefined>(undefined);

export function SupabaseGymDataProvider({ children }: { children: ReactNode }) {
  const studentsHook = useSupabaseStudents();
  const paymentsHook = useSupabasePayments();
  const checkInsHook = useSupabaseCheckIns();
  const plansHook = useSupabasePlans();
  const classesHook = useSupabaseClasses();
  const planHistoryHook = useSupabasePlanHistory();

  const value: SupabaseGymDataContextType = {
    // Students
    students: studentsHook.students,
    studentsLoading: studentsHook.loading,
    addStudent: studentsHook.addStudent,
    updateStudent: studentsHook.updateStudent,
    deleteStudent: studentsHook.deleteStudent,
    refetchStudents: studentsHook.refetch,

    // Payments
    payments: paymentsHook.payments,
    paymentsLoading: paymentsHook.loading,
    addPayment: paymentsHook.addPayment,
    updatePayment: paymentsHook.updatePayment,
    refetchPayments: paymentsHook.refetch,

    // Check-ins
    checkIns: checkInsHook.checkIns,
    checkInsLoading: checkInsHook.loading,
    addCheckIn: checkInsHook.addCheckIn,
    updateCheckIn: checkInsHook.updateCheckIn,
    refetchCheckIns: checkInsHook.refetch,

    // Plans
    plans: plansHook.plans,
    plansLoading: plansHook.loading,
    refetchPlans: plansHook.refetch,

    // Classes
    classes: classesHook.classes,
    classesLoading: classesHook.loading,
    addClass: classesHook.addClass,
    updateClass: classesHook.updateClass,
    deleteClass: classesHook.deleteClass,
    refetchClasses: classesHook.refetch,

    // Plan History
    planHistory: planHistoryHook.planHistory,
    planHistoryLoading: planHistoryHook.loading,
    addPlanHistory: planHistoryHook.addPlanHistory,
    updatePlanHistory: planHistoryHook.updatePlanHistory,
    refetchPlanHistory: planHistoryHook.refetch,
  };

  // Ativa real-time updates
  useSupabaseRealtime({
    refetchStudents: studentsHook.refetch,
    refetchPayments: paymentsHook.refetch,
    refetchCheckIns: checkInsHook.refetch,
    refetchPlans: plansHook.refetch,
    refetchClasses: classesHook.refetch,
    refetchPlanHistory: planHistoryHook.refetch,
  });

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
