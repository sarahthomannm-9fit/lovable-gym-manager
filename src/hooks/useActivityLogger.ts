
import { useState, useEffect } from 'react';
import { useSupabaseGymData } from '@/contexts/SupabaseGymDataContext';

export interface ActivityLog {
  id: string;
  type: 'student' | 'payment' | 'plan' | 'class' | 'checkin';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
  userId?: string;
}

export function useActivityLogger() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const { students, payments, plans, classes, checkIns } = useSupabaseGymData();

  const logActivity = (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    setActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Manter apenas 50 atividades
    
    // Armazenar no localStorage para persistência
    const storedActivities = JSON.parse(localStorage.getItem('gym_activities') || '[]');
    const updatedActivities = [newActivity, ...storedActivities.slice(0, 99)]; // Manter 100 no storage
    localStorage.setItem('gym_activities', JSON.stringify(updatedActivities));
  };

  const getRecentActivities = (limit: number = 10): ActivityLog[] => {
    return activities.slice(0, limit);
  };

  const clearActivities = () => {
    setActivities([]);
    localStorage.removeItem('gym_activities');
  };

  // Carregar atividades do localStorage na inicialização
  useEffect(() => {
    const storedActivities = JSON.parse(localStorage.getItem('gym_activities') || '[]');
    setActivities(storedActivities);
  }, []);

  // Helpers para criar logs automaticamente
  const logStudentAction = (action: 'create' | 'update' | 'delete', studentId: string, studentName: string) => {
    const actionMap = {
      create: 'cadastrou',
      update: 'atualizou',
      delete: 'removeu'
    };

    logActivity({
      type: 'student',
      action,
      entityId: studentId,
      entityName: studentName,
      description: `${actionMap[action]} o aluno ${studentName}`
    });
  };

  const logPaymentAction = (action: 'create' | 'update', paymentId: string, studentName: string, amount: number) => {
    const actionMap = {
      create: 'registrou',
      update: 'atualizou'
    };

    logActivity({
      type: 'payment',
      action,
      entityId: paymentId,
      entityName: studentName,
      description: `${actionMap[action]} pagamento de ${studentName} - R$ ${amount.toFixed(2)}`
    });
  };

  const logPlanAction = (action: 'create' | 'update' | 'delete', planId: string, planName: string) => {
    const actionMap = {
      create: 'criou',
      update: 'atualizou',
      delete: 'removeu'
    };

    logActivity({
      type: 'plan',
      action,
      entityId: planId,
      entityName: planName,
      description: `${actionMap[action]} o plano ${planName}`
    });
  };

  const logCheckInAction = (studentName: string, checkInId: string) => {
    logActivity({
      type: 'checkin',
      action: 'create',
      entityId: checkInId,
      entityName: studentName,
      description: `${studentName} fez check-in`
    });
  };

  const logClassAction = (action: 'create' | 'update' | 'delete', classId: string, className: string) => {
    const actionMap = {
      create: 'agendou',
      update: 'atualizou',
      delete: 'cancelou'
    };

    logActivity({
      type: 'class',
      action,
      entityId: classId,
      entityName: className,
      description: `${actionMap[action]} a aula ${className}`
    });
  };

  return {
    activities,
    logActivity,
    getRecentActivities,
    clearActivities,
    // Helpers específicos
    logStudentAction,
    logPaymentAction,
    logPlanAction,
    logCheckInAction,
    logClassAction
  };
}
