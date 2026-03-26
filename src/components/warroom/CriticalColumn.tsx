import { SmartAlert } from '@/hooks/useSmartAlerts';
import { ActionCard } from './ActionCard';
import { Flame } from 'lucide-react';

interface CriticalColumnProps {
  alerts: SmartAlert[];
  onResolve?: (id: string) => void;
}

export function CriticalColumn({ alerts, onResolve }: CriticalColumnProps) {
  const items = alerts.filter(a => a.coluna === 'critico').slice(0, 7);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Flame className="h-4 w-4 text-destructive" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          O que está quebrando
        </h2>
        {items.length > 0 && (
          <span className="ml-auto text-xs font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">
          ✅ Nenhum item crítico
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(alert => (
            <ActionCard key={alert.id} alert={alert} onResolve={onResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
