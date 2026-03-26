import { SmartAlert } from '@/hooks/useSmartAlerts';
import { CrossMetrics } from '@/hooks/useCrossMetrics';
import { ActionCard } from './ActionCard';
import { EventsTimeline } from '@/components/EventsTimeline';
import { Cog, Activity } from 'lucide-react';

interface SystemColumnProps {
  metrics: CrossMetrics;
  alerts: SmartAlert[];
}

export function SystemColumn({ metrics, alerts }: SystemColumnProps) {
  const systemAlerts = alerts.filter(a => a.coluna === 'sistema').slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Cog className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sistema operando
        </h2>
        <Activity className="h-3 w-3 text-[hsl(var(--urgency-opportunity))] ml-auto animate-pulse" />
      </div>

      {/* System alerts */}
      {systemAlerts.length > 0 ? (
        <div className="space-y-2">
          {systemAlerts.map(alert => (
            <ActionCard key={alert.id} alert={alert} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground text-xs">
          Nenhuma automação ativa
        </div>
      )}

      {/* Recent events mini-timeline */}
      <EventsTimeline limit={8} />
    </div>
  );
}
