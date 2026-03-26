import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmartAlert } from '@/hooks/useSmartAlerts';
import { CrossMetrics } from '@/hooks/useCrossMetrics';
import { ActionCard } from './ActionCard';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, Users, Percent, AlertTriangle, 
  UserCheck, TrendingUp, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessColumnProps {
  metrics: CrossMetrics;
  alerts: SmartAlert[];
}

export function BusinessColumn({ metrics, alerts }: BusinessColumnProps) {
  const navigate = useNavigate();
  const decisionAlerts = alerts.filter(a => a.coluna === 'decisao').slice(0, 5);

  const mrr = metrics.receitaMensal || 0;
  const churnRate = metrics.totalAlunos ? ((metrics.alunosInativos || 0) / metrics.totalAlunos * 100) : 0;

  const kpis = [
    { label: 'MRR', value: `R$ ${mrr.toLocaleString('pt-BR')}`, delta: metrics.crescimentoReceita, icon: DollarSign, route: '/relatorios' },
    { label: 'Ativos', value: metrics.alunosAtivos, icon: Users, route: '/alunos' },
    { label: 'Churn', value: `${churnRate.toFixed(1)}%`, warn: churnRate > 10, icon: Percent, route: '/alunos' },
    { label: 'Inadimpl.', value: `R$ ${(metrics.totalInadimplente || 0).toLocaleString('pt-BR')}`, warn: metrics.totalInadimplente > 0, icon: AlertTriangle, route: '/pagamentos' },
    { label: 'Conversão', value: `${metrics.taxaConversaoExperimental.toFixed(0)}%`, icon: UserCheck, route: '/experimentais' },
    { label: 'LTV', value: `R$ ${(metrics.ltvMedio || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, icon: TrendingUp, route: '/relatorios' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          O que decide o mês
        </h2>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-3 gap-2">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card 
              key={kpi.label} 
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate(kpi.route)}
            >
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                  <Icon className={cn('h-3 w-3', kpi.warn ? 'text-destructive' : 'text-muted-foreground')} />
                </div>
                <div className={cn('text-sm font-bold', kpi.warn && 'text-destructive')}>
                  {kpi.value}
                </div>
                {kpi.delta !== undefined && (
                  <span className={cn(
                    'text-[10px]',
                    kpi.delta > 0 ? 'text-[hsl(var(--urgency-opportunity))]' : kpi.delta < 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {kpi.delta > 0 ? '+' : ''}{kpi.delta.toFixed(1)}%
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Decision alerts */}
      {decisionAlerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">Decisões pendentes</p>
          {decisionAlerts.map(alert => (
            <ActionCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
