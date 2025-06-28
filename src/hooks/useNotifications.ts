
import { useState } from "react";
import { Notification } from "@/types/communication";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const markNotificationAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      id: notifications.length + 1,
      timestamp: new Date().toISOString(),
      ...notification
    };
    setNotifications([...notifications, newNotification]);
    return newNotification;
  };

  return {
    notifications,
    markNotificationAsRead,
    addNotification
  };
}
