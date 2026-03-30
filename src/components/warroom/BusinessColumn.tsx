import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmartAlert } from '@/hooks/useSmartAlerts';
import { ActionCard } from './ActionCard';
import { useNavigate } from 'react-router-dom';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { 
  DollarSign, Users, Percent, AlertTriangle, 
  UserCheck, TrendingUp, BarChart3, Clock, CalendarCheck, Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossMetrics } from '@/hooks/useCrossMetrics';

interface BusinessColumnProps {
  metrics: CrossMetrics;
  alerts: SmartAlert[];
}

export function BusinessColumn({ metrics, alerts }: BusinessColumnProps) {
  const navigate = useNavigate();
  const { aulas, leads, experimentais } = useDataIntegration();
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

  // Agenda do dia
  const hojeStr = new Date().toISOString().split('T')[0];
  const aulasHoje = (aulas || []).filter((a: any) => a.data_aula === hojeStr).slice(0, 4);

  // Leads quentes (status novo/agendado, criados recentemente)
  const leadsQuentes = (leads || [])
    .filter((l: any) => ['novo', 'agendado'].includes(l.status))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="text-[9px] font-mono tracking-[0.12em] font-bold text-muted-foreground uppercase">
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
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{kpi.label}</span>
                  <Icon className={cn('h-3 w-3', kpi.warn ? 'text-destructive' : 'text-muted-foreground')} />
                </div>
                <div className={cn('text-sm font-bold font-mono', kpi.warn && 'text-destructive')}>
                  {kpi.value}
                </div>
                {kpi.delta !== undefined && (
                  <span className={cn(
                    'text-[10px] font-mono',
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

      {/* Agenda do Dia */}
      {aulasHoje.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-1">
            <CalendarCheck className="h-3 w-3 text-muted-foreground" />
            <span className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">Agenda Hoje</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {aulasHoje.map((aula: any) => (
              <Card key={aula.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate('/aulas')}>
                <CardContent className="p-2">
                  <p className="text-[11px] font-medium truncate">{aula.nome}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {aula.horario_inicio?.slice(0, 5)}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                      {aula.inscritos_atual || 0}/{aula.capacidade_maxima || 20}
                    </span>
                  </div>
                  {!aula.professor_id && (
                    <Badge variant="destructive" className="text-[8px] h-3 px-1 mt-1">SEM INSTRUTOR</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Leads Quentes */}
      {leadsQuentes.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-1">
            <Flame className="h-3 w-3 text-[hsl(var(--urgency-critical))]" />
            <span className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">Leads Quentes</span>
          </div>
          {leadsQuentes.map((lead: any) => (
            <Card key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate('/marketing/captacao')}>
              <CardContent className="p-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--urgency-critical))] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{lead.nome}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{lead.fonte || 'direto'} · {lead.status}</p>
                </div>
                {lead.telefone && <span className="text-[10px] text-muted-foreground font-mono shrink-0">{lead.telefone}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Decision alerts */}
      {decisionAlerts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-mono tracking-wider text-muted-foreground px-1 uppercase">Decisões Pendentes</p>
          {decisionAlerts.map(alert => (
            <ActionCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
