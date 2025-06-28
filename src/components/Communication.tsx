
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageForm } from "./MessageForm";
import { MessageStats } from "./MessageStats";
import { MessageList } from "./MessageList";
import { NotificationList } from "./NotificationList";

interface Message {
  id: number;
  type: 'chat' | 'email' | 'notification';
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

export function Communication() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'chat',
      from: 'Personal Trainer',
      to: 'João Silva',
      content: 'Lembre-se do treino hoje às 14h!',
      timestamp: '2024-01-23T13:30:00',
      status: 'read'
    },
    {
      id: 2,
      type: 'email',
      from: 'Sistema',
      to: 'Maria Santos',
      subject: 'Avaliação Física Agendada',
      content: 'Sua avaliação física foi agendada para amanhã às 10h.',
      timestamp: '2024-01-23T10:15:00',
      status: 'delivered'
    },
    {
      id: 3,
      type: 'notification',
      from: 'Sistema',
      to: 'Todos os Alunos',
      subject: 'Novos Equipamentos',
      content: 'Temos novos equipamentos disponíveis na academia!',
      timestamp: '2024-01-23T08:00:00',
      status: 'sent'
    }
  ]);

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

  const handleSendMessage = (newMessage: Omit<Message, 'id' | 'from' | 'timestamp' | 'status'>) => {
    const message: Message = {
      id: messages.length + 1,
      ...newMessage,
      from: 'Personal Trainer',
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setMessages([...messages, message]);
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Comunicação
          </h1>
          <p className="text-gray-600 mt-1">Central de mensagens e notificações</p>
        </div>
        
        <MessageForm onSendMessage={handleSendMessage} />
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="space-y-4">
            <MessageStats messages={messages} />
            <MessageList messages={messages} />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationList 
            notifications={notifications} 
            onMarkAsRead={markNotificationAsRead} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
