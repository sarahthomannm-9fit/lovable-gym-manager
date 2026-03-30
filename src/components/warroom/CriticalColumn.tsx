import { SmartAlert } from '@/hooks/useSmartAlerts';
import { ActionCard } from './ActionCard';
import { DollarSign, Users, CalendarX } from 'lucide-react';

interface CriticalColumnProps {
  alerts: SmartAlert[];
  onResolve?: (id: string) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any }> = {
  financeiro: { label: 'FINANCEIRO', icon: DollarSign },
  operacao: { label: 'OPERAÇÃO', icon: CalendarX },
  retencao: { label: 'RETENÇÃO', icon: Users },
};

function categorizeAlert(alert: SmartAlert): string {
  if (alert.id.includes('inadimpl') || alert.id.includes('receita') || alert.id.includes('cobr')) return 'financeiro';
  if (alert.id.includes('aula') || alert.id.includes('instrutor')) return 'operacao';
  return 'retencao';
}

export function CriticalColumn({ alerts, onResolve }: CriticalColumnProps) {
  const items = alerts.filter(a => a.coluna === 'critico').slice(0, 7);

  const grouped = items.reduce((acc, alert) => {
    const cat = categorizeAlert(alert);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(alert);
    return acc;
  }, {} as Record<string, SmartAlert[]>);

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
        <div className="space-y-3">
          {Object.entries(grouped).map(([cat, catAlerts]) => {
            const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.retencao;
            const CatIcon = config.icon;
            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <CatIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">
                    {config.label}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground ml-auto">{catAlerts.length}</span>
                </div>
                {catAlerts.map(alert => (
                  <ActionCard key={alert.id} alert={alert} onResolve={onResolve} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
