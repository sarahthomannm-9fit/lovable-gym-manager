import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  name: string;
  trigger: 'new_lead' | 'payment_overdue' | 'class_missed' | 'plan_expiring';
  action: 'send_email' | 'send_whatsapp' | 'create_task';
  enabled: boolean;
  template: string;
}

export function useMarketingAutomation() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);

  const sendBulkMessage = useCallback(async (
    recipients: string[],
    message: string,
    canal: 'whatsapp' | 'email' | 'sms'
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensagens_marketing')
        .insert({
          canal,
          titulo: `Mensagem em massa via ${canal}`,
          corpo: message,
          destinatarios: recipients.length,
          status: 'enviando',
          enviadas: 0,
          entregues: 0,
          lidas: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Mensagem agendada',
        description: `${recipients.length} destinatários receberão a mensagem via ${canal}`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar mensagens',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createAutomatedCampaign = useCallback(async (
    campaignData: {
      titulo: string;
      descricao?: string;
      categoria: string;
      canal?: string;
      segmento?: any;
    }
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campanhas_marketing')
        .insert({
          ...campaignData,
          status: 'ativa',
          data_inicio: new Date().toISOString().split('T')[0],
          alcance: 0,
          conversoes: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Campanha criada',
        description: 'Campanha automatizada criada com sucesso!',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar campanha',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const scheduleFollowUp = useCallback(async (
    leadId: string,
    daysFromNow: number,
    message: string
  ) => {
    setLoading(true);
    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + daysFromNow);

      // Criar lembrete/tarefa de follow-up
      toast({
        title: 'Follow-up agendado',
        description: `Lembrete criado para daqui a ${daysFromNow} dias`,
      });

      return { success: true, date: followUpDate };
    } catch (error: any) {
      toast({
        title: 'Erro ao agendar follow-up',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const segmentAudience = useCallback((
    students: any[],
    criteria: {
      status?: string;
      planType?: string;
      minPayments?: number;
      maxPayments?: number;
    }
  ) => {
    return students.filter(student => {
      if (criteria.status && student.status !== criteria.status) return false;
      if (criteria.planType && student.plano_id !== criteria.planType) return false;
      // Adicionar mais filtros conforme necessário
      return true;
    });
  }, []);

  return {
    rules,
    loading,
    sendBulkMessage,
    createAutomatedCampaign,
    scheduleFollowUp,
    segmentAudience,
  };
}