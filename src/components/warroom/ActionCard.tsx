import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SmartAlert } from '@/hooks/useSmartAlerts';
import { 
  AlertCircle, AlertTriangle, TrendingUp, Info,
  ChevronRight, Loader2, CheckCircle2
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
    badgeClass: 'bg-[hsl(var(--urgency-critical))] text-[hsl(var(--urgency-critical-foreground))] hover:bg-[hsl(var(--urgency-critical))]/90',
  },
  atencao: {
    icon: AlertTriangle,
    badge: 'Atenção',
    borderClass: 'border-l-4 border-l-[hsl(var(--urgency-attention))]',
    badgeClass: 'bg-[hsl(var(--urgency-attention))] text-[hsl(var(--urgency-attention-foreground))] hover:bg-[hsl(var(--urgency-attention))]/90',
  },
  oportunidade: {
    icon: TrendingUp,
    badge: 'Oportunidade',
    borderClass: 'border-l-4 border-l-[hsl(var(--urgency-opportunity))]',
    badgeClass: 'bg-[hsl(var(--urgency-opportunity))] text-[hsl(var(--urgency-opportunity-foreground))] hover:bg-[hsl(var(--urgency-opportunity))]/90',
  },
  info: {
    icon: Info,
    badge: 'Info',
    borderClass: 'border-l-4 border-l-[hsl(var(--urgency-info))]',
    badgeClass: 'bg-[hsl(var(--urgency-info))] text-[hsl(var(--urgency-info-foreground))] hover:bg-[hsl(var(--urgency-info))]/90',
  },
};

export function ActionCard({ alert, onResolve }: ActionCardProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<'idle' | 'executing' | 'resolved'>('idle');
  const config = TIPO_CONFIG[alert.tipo];
  const Icon = config.icon;

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

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-md',
        config.borderClass,
        state === 'executing' && 'opacity-60 pointer-events-none'
      )}
      onClick={handleAction}
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
            
            {/* Actions on hover */}
            <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs px-2 gap-1"
                onClick={handleAction}
              >
                {alert.acao} <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={handleResolve}
              >
                {state === 'executing' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          {alert.valor && (
            <span className="text-xs font-semibold text-destructive shrink-0">
              R$ {alert.valor.toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
