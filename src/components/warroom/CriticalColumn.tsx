import { SmartAlert } from '@/hooks/useSmartAlerts';
import { ActionCard } from './ActionCard';

interface CriticalColumnProps {
  alerts: SmartAlert[];
  onResolve?: (id: string) => void;
}

export function CriticalColumn({ alerts, onResolve }: CriticalColumnProps) {
  const items = alerts.filter(a => a.coluna === 'critico').slice(0, 7);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        <div className="text-[9px] font-mono tracking-[0.12em] text-urgency-critical font-bold">
          ▼ REQUER AÇÃO AGORA
        </div>
        {items.length > 0 && (
          <span className="ml-auto text-xs font-mono bg-urgency-critical-bg text-urgency-critical px-1.5 py-0.5 rounded border border-urgency-critical-border">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs font-mono">
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
