
import { useState } from "react";
import { Notification } from "@/types/communication";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Pagamento Recebido",
      message: "João Silva - R$ 200,00 via PIX",
      type: "success",
      read: false,
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      title: "Aula Cancelada",
      message: "Maria Santos cancelou a aula de hoje às 15h",
      type: "warning",
      read: false,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      title: "Novo Aluno",
      message: "Pedro Costa se cadastrou para aula experimental",
      type: "info",
      read: true,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const markNotificationAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      id: notifications.length + 1,
      timestamp: new Date().toISOString(),
      ...notification
    };
    setNotifications([newNotification, ...notifications]);
    return newNotification;
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  return {
    notifications,
    markNotificationAsRead,
    markAllAsRead,
    addNotification,
    deleteNotification,
    getUnreadCount
  };
}
