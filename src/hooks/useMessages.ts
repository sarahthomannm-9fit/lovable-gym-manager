
import { useState } from "react";
import { Message } from "@/types/communication";

export function useMessages() {
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

  return {
    messages,
    handleSendMessage
  };
}
