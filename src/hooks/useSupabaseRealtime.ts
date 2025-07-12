
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseGymData } from '@/contexts/SupabaseGymDataContext';

export function useSupabaseRealtime() {
  const { 
    refetchStudents, 
    refetchPayments, 
    refetchCheckIns, 
    refetchPlans, 
    refetchClasses, 
    refetchPlanHistory 
  } = useSupabaseGymData();

  useEffect(() => {
    console.log('Setting up real-time subscriptions...');

    // Real-time para alunos
    const studentsChannel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alunos'
        },
        (payload) => {
          console.log('Students change detected:', payload);
          refetchStudents();
        }
      )
      .subscribe();

    // Real-time para pagamentos
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pagamentos'
        },
        (payload) => {
          console.log('Payments change detected:', payload);
          refetchPayments();
        }
      )
      .subscribe();

    // Real-time para check-ins
    const checkInsChannel = supabase
      .channel('checkins-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins'
        },
        (payload) => {
          console.log('Check-ins change detected:', payload);
          refetchCheckIns();
        }
      )
      .subscribe();

    // Real-time para planos
    const plansChannel = supabase
      .channel('plans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planos'
        },
        (payload) => {
          console.log('Plans change detected:', payload);
          refetchPlans();
        }
      )
      .subscribe();

    // Real-time para aulas
    const classesChannel = supabase
      .channel('classes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aulas'
        },
        (payload) => {
          console.log('Classes change detected:', payload);
          refetchClasses();
        }
      )
      .subscribe();

    // Real-time para histórico de planos
    const planHistoryChannel = supabase
      .channel('plan-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historico_planos'
        },
        (payload) => {
          console.log('Plan history change detected:', payload);
          refetchPlanHistory();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(checkInsChannel);
      supabase.removeChannel(plansChannel);
      supabase.removeChannel(classesChannel);
      supabase.removeChannel(planHistoryChannel);
    };
  }, [refetchStudents, refetchPayments, refetchCheckIns, refetchPlans, refetchClasses, refetchPlanHistory]);
}
