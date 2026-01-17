import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notificacao {
  id: string;
  tipo: 'pagamento' | 'aula' | 'aniversario' | 'avaliacao' | 'promocao' | 'lembrete' | 'sistema';
  titulo: string;
  mensagem: string;
  destinatario_tipo: 'aluno' | 'funcionario' | 'todos';
  destinatario_id: string | null;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  status: 'pendente' | 'enviada' | 'lida' | 'arquivada';
  data_agendada: string | null;
  data_envio: string | null;
  data_leitura: string | null;
  canal: string[];
  enviado_email: boolean;
  enviado_whatsapp: boolean;
  enviado_push: boolean;
  dados_extras: Record<string, any>;
  created_at: string;
}

export type NotificacaoInput = Omit<Notificacao, 'id' | 'created_at' | 'data_envio' | 'data_leitura'>;

export function useNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotificacoes((data || []) as Notificacao[]);
    } catch (error) {
      console.error('Error fetching notificacoes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNotificacao = useCallback(async (notificacao: NotificacaoInput) => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .insert(notificacao)
        .select()
        .single();

      if (error) throw error;

      setNotificacoes(prev => [data as Notificacao, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating notificacao:', error);
      throw error;
    }
  }, []);

  const marcarComoLida = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ 
          status: 'lida',
          data_leitura: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setNotificacoes(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'lida' as const, data_leitura: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Error marking notificacao as read:', error);
    }
  }, []);

  const arquivar = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ status: 'arquivada' })
        .eq('id', id);

      if (error) throw error;

      setNotificacoes(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'arquivada' as const } : n)
      );
    } catch (error) {
      console.error('Error archiving notificacao:', error);
    }
  }, []);

  const getNaoLidas = useCallback(() => {
    return notificacoes.filter(n => n.status === 'pendente' || n.status === 'enviada');
  }, [notificacoes]);

  const getByDestinatario = useCallback((destinatarioId: string) => {
    return notificacoes.filter(n => 
      n.destinatario_id === destinatarioId || n.destinatario_tipo === 'todos'
    );
  }, [notificacoes]);

  const enviarNotificacaoSistema = useCallback(async (
    titulo: string,
    mensagem: string,
    tipo: Notificacao['tipo'] = 'sistema',
    prioridade: Notificacao['prioridade'] = 'normal'
  ) => {
    return createNotificacao({
      tipo,
      titulo,
      mensagem,
      destinatario_tipo: 'todos',
      destinatario_id: null,
      prioridade,
      status: 'enviada',
      data_agendada: null,
      canal: ['sistema'],
      enviado_email: false,
      enviado_whatsapp: false,
      enviado_push: false,
      dados_extras: {},
    });
  }, [createNotificacao]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  return {
    notificacoes,
    loading,
    createNotificacao,
    marcarComoLida,
    arquivar,
    getNaoLidas,
    getByDestinatario,
    enviarNotificacaoSistema,
    refetch: fetchNotificacoes,
  };
}
