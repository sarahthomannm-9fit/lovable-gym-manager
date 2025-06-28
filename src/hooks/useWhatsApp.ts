
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'class_reminder' | 'evaluation_reminder' | 'payment_notification' | 'cancellation';
}

export function useWhatsApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (messageData: WhatsAppMessage) => {
    setIsSending(true);
    try {
      // Simular envio de WhatsApp - substituir por integração real
      console.log('Enviando WhatsApp:', messageData);
      
      // Aqui você integraria com a API do WhatsApp Business
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Mensagem Enviada",
        description: `WhatsApp enviado para ${messageData.to}`,
      });
      
      return { success: true };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar WhatsApp",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsSending(false);
    }
  };

  const sendClassReminder = async (studentPhone: string, studentName: string, classTime: string) => {
    const message = `Olá ${studentName}! Lembrete: você tem aula agendada para ${classTime}. Nos vemos lá! 💪`;
    return sendMessage({
      to: studentPhone,
      message,
      type: 'class_reminder'
    });
  };

  const sendEvaluationReminder = async (studentPhone: string, studentName: string) => {
    const message = `Oi ${studentName}! É hora da sua avaliação física. Vamos verificar seu progresso? 📊`;
    return sendMessage({
      to: studentPhone,
      message,
      type: 'evaluation_reminder'
    });
  };

  const sendPaymentNotification = async (phone: string, amount: number, dueDate: string) => {
    const message = `Olá! Sua mensalidade de R$ ${amount.toFixed(2)} vence em ${dueDate}. Para facilitar, você pode pagar via PIX. Obrigado! 💳`;
    return sendMessage({
      to: phone,
      message,
      type: 'payment_notification'
    });
  };

  return {
    isConnected,
    isSending,
    sendMessage,
    sendClassReminder,
    sendEvaluationReminder,
    sendPaymentNotification
  };
}
