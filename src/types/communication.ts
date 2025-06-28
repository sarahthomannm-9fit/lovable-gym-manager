
export interface Message {
  id: number;
  type: 'chat' | 'email' | 'notification';
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}
