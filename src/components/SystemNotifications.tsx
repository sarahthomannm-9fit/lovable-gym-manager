
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, CreditCard, Users, X, Clock } from "lucide-react";
import { useSupabaseGymData } from '@/contexts/SupabaseGymDataContext';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  dismissed?: boolean;
}

export function SystemNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);
  
  const {
    students,
    payments,
    classes,
    planHistory,
    studentsLoading,
    paymentsLoading,
    classesLoading,
    planHistoryLoading
  } = useSupabaseGymData();

  const generateNotifications = () => {
    if (studentsLoading || paymentsLoading || classesLoading || planHistoryLoading) {
      return;
    }

    const newNotifications: Notification[] = [];

    // Verificar pagamentos em atraso
    const overduePayments = payments.filter(payment => 
      payment.status === 'atrasado' || 
      (payment.status === 'pendente' && new Date(payment.data_vencimento) < new Date())
    );

    if (overduePayments.length > 0) {
      newNotifications.push({
        id: 'overdue-payments',
        type: 'error',
        title: 'Pagamentos em Atraso',
        message: `${overduePayments.length} pagamento(s) estão em atraso`,
        icon: CreditCard,
        priority: 'high',
        createdAt: new Date().toISOString()
      });
    }

    // Verificar vencimentos próximos (próximos 7 dias)
    const upcomingDue = payments.filter(payment => {
      if (payment.status !== 'pendente') return false;
      const dueDate = new Date(payment.data_vencimento);
      const today = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    });

    if (upcomingDue.length > 0) {
      newNotifications.push({
        id: 'upcoming-due',
        type: 'warning',
        title: 'Vencimentos Próximos',
        message: `${upcomingDue.length} pagamento(s) vencem nos próximos 7 dias`,
        icon: Clock,
        priority: 'medium',
        createdAt: new Date().toISOString()
      });
    }

    // Verificar alunos sem plano ativo
    const studentsWithoutActivePlan = students.filter(student => 
      !planHistory.some(history => 
        history.aluno_id === student.id && 
        history.ativo === true &&
        (!history.data_fim || new Date(history.data_fim) > new Date())
      )
    );

    if (studentsWithoutActivePlan.length > 0) {
      newNotifications.push({
        id: 'students-no-plan',
        type: 'warning',
        title: 'Alunos sem Plano Ativo',
        message: `${studentsWithoutActivePlan.length} aluno(s) não possuem plano ativo`,
        icon: Users,
        priority: 'medium',
        createdAt: new Date().toISOString()
      });
    }

    // Verificar aulas para hoje
    const today = new Date().toISOString().split('T')[0];
    const todayClasses = classes.filter(cls => cls.data_aula === today);

    if (todayClasses.length > 0) {
      newNotifications.push({
        id: 'classes-today',
        type: 'info',
        title: 'Aulas Hoje',
        message: `${todayClasses.length} aula(s) agendada(s) para hoje`,
        icon: Calendar,
        priority: 'low',
        createdAt: new Date().toISOString()
      });
    }

    // Verificar planos vencendo em 30 dias
    const expiringPlans = planHistory.filter(history => {
      if (!history.ativo || !history.data_fim) return false;
      const endDate = new Date(history.data_fim);
      const today = new Date();
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    });

    if (expiringPlans.length > 0) {
      newNotifications.push({
        id: 'expiring-plans',
        type: 'warning',
        title: 'Planos Vencendo',
        message: `${expiringPlans.length} plano(s) vencem nos próximos 30 dias`,
        icon: AlertCircle,
        priority: 'medium',
        createdAt: new Date().toISOString()
      });
    }

    // Remover notificações já dispensadas
    const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    const filteredNotifications = newNotifications.filter(n => !dismissedIds.includes(n.id));

    setNotifications(filteredNotifications);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Salvar no localStorage
    const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    const updatedDismissed = [...dismissedIds, id];
    localStorage.setItem('dismissed_notifications', JSON.stringify(updatedDismissed));
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getBadgeVariant = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    generateNotifications();
  }, [students, payments, classes, planHistory, studentsLoading, paymentsLoading, classesLoading, planHistoryLoading]);

  if (notifications.length === 0) {
    return null;
  }

  const highPriorityNotifications = notifications.filter(n => n.priority === 'high');
  const otherNotifications = notifications.filter(n => n.priority !== 'high');
  const displayNotifications = showAll ? notifications : highPriorityNotifications;

  return (
    <div className="space-y-4">
      {displayNotifications.map((notification) => {
        const IconComponent = notification.icon;
        return (
          <Card key={notification.id} className={getNotificationColor(notification.type)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <IconComponent className="w-5 h-5" />
                  <CardTitle className="text-base">{notification.title}</CardTitle>
                  <Badge variant={getBadgeVariant(notification.type)}>
                    {notification.priority === 'high' ? 'Urgente' : 
                     notification.priority === 'medium' ? 'Importante' : 'Info'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(notification.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{notification.message}</p>
            </CardContent>
          </Card>
        );
      })}

      {otherNotifications.length > 0 && !showAll && (
        <Button
          variant="outline"
          onClick={() => setShowAll(true)}
          className="w-full"
        >
          Ver todas as notificações ({otherNotifications.length} restantes)
        </Button>
      )}

      {showAll && otherNotifications.length > 0 && (
        <Button
          variant="outline"
          onClick={() => setShowAll(false)}
          className="w-full"
        >
          Mostrar apenas urgentes
        </Button>
      )}
    </div>
  );
}
