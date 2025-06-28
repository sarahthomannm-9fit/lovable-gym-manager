
import { useState } from "react";
import { Message } from "@/types/communication";

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

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
