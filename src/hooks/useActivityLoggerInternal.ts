
import { useState, useCallback } from 'react';

export interface Activity {
  id: string;
  type: 'student' | 'payment' | 'plan' | 'checkin' | 'class';
  action: 'create' | 'update' | 'delete' | 'checkin';
  description: string;
  timestamp: string;
}

export function useActivityLoggerInternal() {
  const [activities, setActivities] = useState<Activity[]>([]);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    
    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep only last 50 activities
  }, []);

  const logStudentAction = useCallback((action: 'create' | 'update' | 'delete', studentId: string, studentName: string) => {
    addActivity({
      type: 'student',
      action,
      description: `${action === 'create' ? 'Cadastrou' : action === 'update' ? 'Atualizou' : 'Removeu'} o aluno ${studentName}`,
    });
  }, [addActivity]);

  const logPaymentAction = useCallback((action: 'create' | 'update', paymentId: string, studentName: string, amount: number) => {
    addActivity({
      type: 'payment',
      action,
      description: `${action === 'create' ? 'Registrou' : 'Atualizou'} pagamento de R$ ${amount.toFixed(2)} para ${studentName}`,
    });
  }, [addActivity]);

  const logPlanAction = useCallback((action: 'create' | 'update' | 'delete', planId: string, planName: string) => {
    addActivity({
      type: 'plan',
      action,
      description: `${action === 'create' ? 'Criou' : action === 'update' ? 'Atualizou' : 'Removeu'} o plano ${planName}`,
    });
  }, [addActivity]);

  const logCheckInAction = useCallback((studentName: string, checkInId: string) => {
    addActivity({
      type: 'checkin',
      action: 'checkin',
      description: `${studentName} fez check-in`,
    });
  }, [addActivity]);

  const logClassAction = useCallback((action: 'create' | 'update' | 'delete', classId: string, className: string) => {
    addActivity({
      type: 'class',
      action,
      description: `${action === 'create' ? 'Criou' : action === 'update' ? 'Atualizou' : 'Removeu'} a aula ${className}`,
    });
  }, [addActivity]);

  return {
    activities,
    logStudentAction,
    logPaymentAction,
    logPlanAction,
    logCheckInAction,
    logClassAction,
  };
}
