
import { useState } from "react";
import { Notification } from "@/types/communication";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Pagamento Recebido',
      message: 'Pagamento de João Silva - R$ 300,00',
      type: 'success',
      timestamp: '2024-01-23T14:20:00',
      read: false
    },
    {
      id: 2,
      title: 'Aula Cancelada',
      message: 'Maria Santos cancelou a aula de hoje',
      type: 'warning',
      timestamp: '2024-01-23T12:45:00',
      read: true
    },
    {
      id: 3,
      title: 'Nova Avaliação',
      message: 'Pedro Costa solicitou uma reavaliação física',
      type: 'info',
      timestamp: '2024-01-23T09:30:00',
      read: false
    }
  ]);

  const markNotificationAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  return {
    notifications,
    markNotificationAsRead
  };
}
