import { SmartAlert } from '@/hooks/useSmartAlerts';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarRoomBannerProps {
  alerts: SmartAlert[];
}

export function WarRoomBanner({ alerts }: WarRoomBannerProps) {
  const critical = alerts.filter(a => a.tipo === 'urgente');
  const attention = alerts.filter(a => a.tipo === 'atencao');
  const isCritical = critical.length > 0;

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
      isCritical 
        ? 'bg-[hsl(var(--urgency-critical))]/10 text-[hsl(var(--urgency-critical))] border border-[hsl(var(--urgency-critical))]/20'
        : 'bg-[hsl(var(--urgency-opportunity))]/10 text-[hsl(var(--urgency-opportunity))] border border-[hsl(var(--urgency-opportunity))]/20'
    )}>
      {isCritical ? (
        <>
          <AlertCircle className="h-4 w-4 animate-pulse" />
          <span>
            {critical.length} alerta(s) crítico(s)
            {attention.length > 0 && ` · ${attention.length} pendência(s)`}
            {' — ação necessária'}
          </span>
        </>
      ) : alerts.length > 0 ? (
        <>
          <Shield className="h-4 w-4" />
          <span>{alerts.length} item(s) monitorado(s) — nenhum crítico</span>
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4" />
          <span>Operação estável — nenhum alerta ativo</span>
        </>
      )}
    </div>
  );
}
