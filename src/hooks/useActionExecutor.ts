import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AutomationItem } from './useAutomationQueue';

export function useActionExecutor() {
  const { toast } = useToast();
  const [executing, setExecuting] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const execute = useCallback(async (item: AutomationItem) => {
    setExecuting(prev => new Set(prev).add(item.id));

    try {
      if (item.tipo === 'cobranca') {
        await supabase.from('notificacoes').insert({
          tipo: 'cobranca',
          titulo: `Cobrança - ${item.etapa}`,
          mensagem: `${item.acao_sugerida} para ${item.alvo}${item.valor ? ` · R$ ${item.valor.toFixed(2)}` : ''}`,
          destinatario_tipo: 'aluno',
          destinatario_id: item.alvo_id,
          prioridade: item.etapa_num >= 3 ? 'alta' : 'normal',
          canal: ['sistema', 'whatsapp'],
        });
        await supabase.from('system_events').insert({
          entity_type: 'cobranca',
          entity_id: item.alvo_id,
          event_type: 'cobranca.executada',
          metadata: { etapa: item.etapa, acao: item.acao_sugerida, valor: item.valor },
        });
      } else if (item.tipo === 'retencao') {
        await supabase.from('notificacoes').insert({
          tipo: 'retencao',
          titulo: `Retenção - ${item.etapa}`,
          mensagem: `${item.acao_sugerida} para ${item.alvo}`,
          destinatario_tipo: 'aluno',
          destinatario_id: item.alvo_id,
          prioridade: item.etapa_num >= 2 ? 'alta' : 'normal',
          canal: ['sistema', 'whatsapp'],
        });
        await supabase.from('system_events').insert({
          entity_type: 'retencao',
          entity_id: item.alvo_id,
          event_type: 'retencao.executada',
          metadata: { etapa: item.etapa, acao: item.acao_sugerida },
        });
      } else if (item.tipo === 'remarketing') {
        await supabase.from('mensagens_marketing').insert({
          canal: 'whatsapp',
          titulo: `Remarketing ${item.etapa} - ${item.alvo}`,
          corpo: item.acao_sugerida,
          destinatarios: 1,
          status: 'agendada',
        });
        await supabase.from('system_events').insert({
          entity_type: 'remarketing',
          entity_id: item.alvo_id,
          event_type: 'remarketing.executado',
          metadata: { temperatura: item.etapa, acao: item.acao_sugerida },
        });
      }

      setResolved(prev => new Set(prev).add(item.id));
      toast({ title: 'Ação executada', description: `${item.acao_sugerida} para ${item.alvo}` });

      // Auto-remove from resolved after 3s
      setTimeout(() => {
        setResolved(prev => { const n = new Set(prev); n.delete(item.id); return n; });
      }, 3000);
    } catch (error: any) {
      toast({ title: 'Erro ao executar', description: error.message, variant: 'destructive' });
    } finally {
      setExecuting(prev => { const n = new Set(prev); n.delete(item.id); return n; });
    }
  }, [toast]);

  return { execute, executing, resolved };
}
