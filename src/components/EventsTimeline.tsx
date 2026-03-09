import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemEvents } from '@/hooks/useSystemEvents';
import { Activity, Loader2 } from 'lucide-react';

const EVENT_LABELS: Record<string, string> = {
  'payment.created': 'Pagamento criado',
  'payment.paid': 'Pagamento confirmado',
  'payment.updated': 'Pagamento atualizado',
  'checkin.in': 'Check-in',
  'training.created': 'Treino criado',
  'training.updated': 'Treino atualizado',
  'assessment.completed': 'Avaliação realizada',
  'lifecycle.changed': 'Status alterado',
};

const EVENT_COLORS: Record<string, string> = {
  'payment.paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'payment.created': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'checkin.in': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'training.created': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'training.updated': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'assessment.completed': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'lifecycle.changed': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function EventsTimeline({ limit = 20 }: { limit?: number }) {
  const { events, loading } = useSystemEvents({ limit });

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Eventos Recentes</CardTitle></CardHeader>
        <CardContent><div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando...</div></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Eventos Recentes
          {events.length > 0 && <Badge variant="secondary" className="text-xs">{events.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhum evento registrado ainda</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Badge className={`text-xs shrink-0 ${EVENT_COLORS[ev.event_type] || 'bg-muted text-muted-foreground'}`}>
                  {EVENT_LABELS[ev.event_type] || ev.event_type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {ev.metadata?.nome || ev.metadata?.aluno_id?.slice(0, 8) || ev.entity_type}
                    {ev.metadata?.valor && ` • R$ ${ev.metadata.valor}`}
                    {ev.metadata?.new_status && ` → ${ev.metadata.new_status}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(ev.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
