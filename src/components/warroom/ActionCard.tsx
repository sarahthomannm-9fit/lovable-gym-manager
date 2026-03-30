import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SmartAlert } from '@/hooks/useSmartAlerts';
import { 
  AlertCircle, AlertTriangle, TrendingUp, Info,
  ChevronRight, Loader2, CheckCircle2, Clock, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  alert: SmartAlert;
  onResolve?: (id: string) => void;
}

const TIPO_CONFIG = {
  urgente: {
    icon: AlertCircle,
    badge: 'Crítico',
    borderClass: 'border-l-4 border-l-[hsl(var(--urgency-critical))]',
    badgeClass: 'bg-[hsl(var(--urgency-critical))] text-white hover:bg-[hsl(var(--urgency-critical))]/90',
  },
  atencao: {
    icon: AlertTriangle,
    badge: 'Atenção',
    borderClass: 'border-l-4 border-l-[hsl(var(--urgency-attention))]',
    badgeClass: 'bg-[hsl(var(--urgency-attention))] text-black hover:bg-[hsl(var(--urgency-attention))]/90',
  },
  oportunidade: {
    icon: TrendingUp,
    badge: 'Oportunidade',
    borderClass: 'border-l-4 border-l-[hsl(var(--urgency-opportunity))]',
    badgeClass: 'bg-[hsl(var(--urgency-opportunity))] text-black hover:bg-[hsl(var(--urgency-opportunity))]/90',
  },
  info: {
    icon: Info,
    badge: 'Info',
    borderClass: 'border-l-4 border-l-[hsl(var(--urgency-info))]',
    badgeClass: 'bg-[hsl(var(--urgency-info))] text-white hover:bg-[hsl(var(--urgency-info))]/90',
  },
};

const SNOOZE_KEY = 'fitmanager_snoozed_alerts';

function getSnoozed(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}'); } catch { return {}; }
}

function setSnoozed(id: string) {
  const current = getSnoozed();
  current[id] = Date.now() + 24 * 60 * 60 * 1000; // 24h
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(current));
}

function isSnoozed(id: string): boolean {
  const snoozed = getSnoozed();
  if (!snoozed[id]) return false;
  if (Date.now() > snoozed[id]) { 
    const c = getSnoozed(); delete c[id]; localStorage.setItem(SNOOZE_KEY, JSON.stringify(c));
    return false;
  }
  return true;
}

export function ActionCard({ alert, onResolve }: ActionCardProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<'idle' | 'hover' | 'executing' | 'resolved' | 'snoozed'>(() => 
    isSnoozed(alert.id) ? 'snoozed' : 'idle'
  );
  const [snoozeTimeLeft, setSnoozeTimeLeft] = useState('');
  const config = TIPO_CONFIG[alert.tipo];
  const Icon = config.icon;

  // Update snooze timer
  useEffect(() => {
    if (state !== 'snoozed') return;
    const update = () => {
      const snoozed = getSnoozed();
      const remaining = (snoozed[alert.id] || 0) - Date.now();
      if (remaining <= 0) { setState('idle'); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setSnoozeTimeLeft(`${h}h${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [state, alert.id]);

  if (state === 'resolved') return null;

  const handleAction = () => {
    if (alert.rota) navigate(alert.rota);
  };

  const handleResolve = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState('executing');
    setTimeout(() => {
      setState('resolved');
      onResolve?.(alert.id);
    }, 600);
  };

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSnoozed(alert.id);
    setState('snoozed');
  };

  const handleUnsnooze = (e: React.MouseEvent) => {
    e.stopPropagation();
    const c = getSnoozed(); delete c[alert.id]; localStorage.setItem(SNOOZE_KEY, JSON.stringify(c));
    setState('idle');
  };

  // Snoozed state
  if (state === 'snoozed') {
    return (
      <Card className="border-l-4 border-l-muted opacity-50 cursor-pointer" onClick={handleUnsnooze}>
        <CardContent className="p-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Clock className="h-3 w-3" />
            <span className="truncate flex-1">{alert.titulo}</span>
            <span className="shrink-0">volta em {snoozeTimeLeft}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-md',
        config.borderClass,
        state === 'executing' && 'opacity-60 pointer-events-none'
      )}
      onClick={handleAction}
      onMouseEnter={() => state === 'idle' && setState('hover')}
      onMouseLeave={() => state === 'hover' && setState('idle')}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0', config.badgeClass)}>
                {config.badge}
              </Badge>
              {alert.quantidade && (
                <span className="text-xs font-mono text-muted-foreground">{alert.quantidade}x</span>
              )}
            </div>
            <p className="text-sm font-medium leading-tight">{alert.titulo}</p>
            <p className="text-xs text-muted-foreground leading-tight">{alert.descricao}</p>
            
            {/* Expanded context on hover */}
            {state === 'hover' && alert.valor && (
              <div className="text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
                Impacto financeiro: R$ {alert.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            )}

            {/* Actions — always visible on hover */}
            <div className={cn(
              'flex items-center gap-1 pt-1 transition-all duration-200',
              state === 'hover' ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden'
            )}>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2 gap-1" onClick={handleAction}>
                {alert.acao} <ChevronRight className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleResolve} title="Resolver">
                {state === 'executing' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleSnooze} title="Ignorar 24h">
                <Clock className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {alert.valor && state !== 'hover' && (
            <span className="text-xs font-semibold text-destructive shrink-0 font-mono">
              R$ {alert.valor.toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
