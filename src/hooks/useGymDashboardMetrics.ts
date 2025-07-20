
import { useState, useEffect } from 'react';
import { useSupabaseGymData } from '@/contexts/SupabaseGymDataContext';

export interface DashboardMetrics {
  totalStudents: number;
  activeStudents: number;
  classesToday: number;
  monthlyRevenue: number;
  retentionRate: number;
  overduePayments: number;
  recentActivities: Activity[];
  planDistribution: PlanDistribution[];
}

export interface Activity {
  id: string;
  type: 'checkin' | 'payment' | 'registration' | 'class';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

export interface PlanDistribution {
  planName: string;
  studentCount: number;
  percentage: number;
}

export function useGymDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 0,
    activeStudents: 0,
    classesToday: 0,
    monthlyRevenue: 0,
    retentionRate: 0,
    overduePayments: 0,
    recentActivities: [],
    planDistribution: []
  });
  const [loading, setLoading] = useState(true);

  const {
    students,
    studentsLoading,
    payments,
    paymentsLoading,
    checkIns,
    checkInsLoading,
    classes,
    classesLoading,
    plans,
    plansLoading,
    planHistory,
    planHistoryLoading
  } = useSupabaseGymData();

  const calculateMetrics = () => {
    if (studentsLoading || paymentsLoading || checkInsLoading || classesLoading || plansLoading || planHistoryLoading) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Total de alunos
    const totalStudents = students.length;

    // Alunos ativos (com planos ativos no histórico)
    const activeStudents = students.filter(student => 
      planHistory.some(history => 
        history.aluno_id === student.id && 
        history.ativo === true &&
        (!history.data_fim || new Date(history.data_fim) > new Date())
      )
    ).length;

    // Aulas hoje
    const classesToday = classes.filter(cls => 
      cls.data_aula === today
    ).length;

    // Receita mensal
    const monthlyRevenue = payments
      .filter(payment => {
        const paymentDate = new Date(payment.data_pagamento || payment.created_at || '');
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear &&
               payment.status === 'pago';
      })
      .reduce((sum, payment) => sum + Number(payment.valor), 0);

    // Taxa de retenção (simplificada)
    const retentionRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

    // Pagamentos em atraso
    const overduePayments = payments.filter(payment => 
      payment.status === 'atrasado' || 
      (payment.status === 'pendente' && new Date(payment.data_vencimento) < new Date())
    ).length;

    // Atividades recentes
    const recentActivities: Activity[] = [];

    // Check-ins recentes
    const recentCheckIns = checkIns
      .slice(0, 3)
      .map(checkIn => {
        const student = students.find(s => s.id === checkIn.aluno_id);
        return {
          id: checkIn.id,
          type: 'checkin' as const,
          message: `${student?.nome || 'Aluno'} fez check-in`,
          timestamp: checkIn.horario_entrada,
          status: 'success' as const
        };
      });

    // Pagamentos recentes
    const recentPayments = payments
      .filter(p => p.status === 'pago')
      .slice(0, 2)
      .map(payment => {
        const student = students.find(s => s.id === payment.aluno_id);
        return {
          id: payment.id,
          type: 'payment' as const,
          message: `Pagamento de ${student?.nome || 'Aluno'} processado`,
          timestamp: payment.data_pagamento || payment.created_at || '',
          status: 'success' as const
        };
      });

    // Novos registros
    const recentRegistrations = students
      .slice(-2)
      .map(student => ({
        id: student.id,
        type: 'registration' as const,
        message: `${student.nome} se matriculou`,
        timestamp: student.created_at || '',
        status: 'info' as const
      }));

    recentActivities.push(...recentCheckIns, ...recentPayments, ...recentRegistrations);

    // Ordenar por timestamp
    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Distribuição de planos
    const planCounts = new Map<string, number>();
    
    planHistory
      .filter(history => history.ativo === true)
      .forEach(history => {
        const plan = plans.find(p => p.id === history.plano_id);
        if (plan) {
          planCounts.set(plan.nome, (planCounts.get(plan.nome) || 0) + 1);
        }
      });

    const planDistribution: PlanDistribution[] = Array.from(planCounts.entries()).map(([planName, count]) => ({
      planName,
      studentCount: count,
      percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
    }));

    setMetrics({
      totalStudents,
      activeStudents,
      classesToday,
      monthlyRevenue,
      retentionRate,
      overduePayments,
      recentActivities: recentActivities.slice(0, 5),
      planDistribution
    });

    setLoading(false);
  };

  useEffect(() => {
    calculateMetrics();
  }, [
    students, payments, checkIns, classes, plans, planHistory,
    studentsLoading, paymentsLoading, checkInsLoading, classesLoading, plansLoading, planHistoryLoading
  ]);

  return {
    metrics,
    loading,
    refresh: calculateMetrics
  };
}
