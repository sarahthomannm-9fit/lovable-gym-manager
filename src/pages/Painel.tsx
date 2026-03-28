import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageShell } from '@/components/warroom/PageShell';
import { WarRoomBanner } from '@/components/warroom/WarRoomBanner';
import { CriticalColumn } from '@/components/warroom/CriticalColumn';
import { BusinessColumn } from '@/components/warroom/BusinessColumn';
import { SystemColumn } from '@/components/warroom/SystemColumn';
import { DailyActionRecommendations } from '@/components/DailyActionRecommendations';
import { Dashboard } from '@/components/Dashboard';
import { IntegratedInsights } from '@/components/IntegratedInsights';
import { IntelligentFinancialDashboard } from '@/components/reports/IntelligentFinancialDashboard';
import { PainelAluno } from '@/components/PainelAluno';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { Flame, BarChart3, Cog } from 'lucide-react';

export function Painel() {
  const { role } = useCurrentUserRole();
  const isMobile = useIsMobile();
  const { alerts, metrics, loading, refetchAll, insights } = useDataIntegration();
  const [mobileTab, setMobileTab] = useState('critico');

  if (role === 'user') {
    return <PainelAluno />;
  }

  const fmtR = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
  const criticalCount = alerts.filter(a => a.coluna === 'critico').length;
  const totalInsights = insights.retencao.length + insights.crescimento.length + insights.otimizacao.length;
  const churnPct = metrics ? (metrics.totalAlunos > 0 ? ((metrics.totalAlunos - metrics.alunosAtivos) / metrics.totalAlunos * 100) : 0) : 0;

  const shellMetrics = metrics ? [
    { label: 'MRR', value: fmtR(metrics.receitaMensal), sub: `${metrics.crescimentoReceita >= 0 ? '+' : ''}${metrics.crescimentoReceita.toFixed(0)}% vs mês ant.`, color: 'text-primary' },
    { label: 'ALUNOS ATIVOS', value: String(metrics.alunosAtivos), sub: `${metrics.totalAlunos} total` },
    { label: 'INADIMPLÊNCIA', value: fmtR(metrics.totalInadimplente), sub: `${metrics.inadimplencia} alunos`, color: 'text-urgency-critical' },
    { label: 'CHURN', value: `${churnPct.toFixed(1)}%`, sub: `${metrics.totalAlunos - metrics.alunosAtivos} cancel.`, color: 'text-urgency-attention' },
    { label: 'CONVERSÃO', value: `${metrics.taxaConversaoExperimental.toFixed(0)}%`, sub: `${metrics.leadsConvertidos}/${metrics.leadsTotal} leads`, color: 'text-urgency-attention' },
    { label: 'LTV MÉDIO', value: fmtR(metrics.ltvMedio), sub: `ticket ${fmtR(metrics.ticketMedio)}` },
  ] : [];

  if (loading) {
    return (
      <PageShell title="CONTROL PLANE" sub="Carregando dados do ecossistema...">
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-24 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="CONTROL PLANE"
      sub="O que o ecossistema precisa de você agora"
      criticals={criticalCount}
      metrics={shellMetrics}
      actions={
        <button
          onClick={refetchAll}
          className="px-3 py-1.5 text-[10px] font-mono font-semibold tracking-wider rounded bg-transparent text-white/55 border border-white/20 cursor-pointer hover:text-white hover:border-white/40 transition-colors"
        >
          ATUALIZAR
        </button>
      }
    >
      {/* Banner */}
      <WarRoomBanner alerts={alerts} />

      {/* Daily Recommendations */}
      <div className="mt-4">
        <DailyActionRecommendations />
      </div>

      {/* War Room: 3 Columns / Mobile Tabs */}
      <div className="mt-4">
        {isMobile ? (
          <Tabs value={mobileTab} onValueChange={setMobileTab}>
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="critico" className="gap-1 text-[10px] font-mono">
                <Flame className="h-3 w-3" />
                URGENTE
                {criticalCount > 0 && (
                  <span className="ml-1 min-w-[16px] h-4 rounded bg-urgency-critical text-white text-[9px] font-mono font-bold flex items-center justify-center px-1">
                    {criticalCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="decisao" className="gap-1 text-[10px] font-mono">
                <BarChart3 className="h-3 w-3" />
                NEGÓCIO
              </TabsTrigger>
              <TabsTrigger value="sistema" className="gap-1 text-[10px] font-mono">
                <Cog className="h-3 w-3" />
                SISTEMA
              </TabsTrigger>
            </TabsList>
            <TabsContent value="critico" className="mt-3">
              <CriticalColumn alerts={alerts} />
            </TabsContent>
            <TabsContent value="decisao" className="mt-3">
              <BusinessColumn metrics={metrics} alerts={alerts} />
            </TabsContent>
            <TabsContent value="sistema" className="mt-3">
              <SystemColumn metrics={metrics} alerts={alerts} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-3 gap-4 items-start">
            <CriticalColumn alerts={alerts} />
            <BusinessColumn metrics={metrics} alerts={alerts} />
            <SystemColumn metrics={metrics} alerts={alerts} />
          </div>
        )}
      </div>

      {/* Deep Dive */}
      <Tabs defaultValue="dashboard" className="space-y-4 mt-6 pt-4 border-t border-border">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted">
          <TabsTrigger value="dashboard" className="text-xs font-mono">Dashboard</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs font-mono relative">
            Insights IA
            {totalInsights > 0 && (
              <span className="ml-1.5 min-w-[16px] h-4 rounded bg-urgency-critical text-white text-[9px] font-mono font-bold flex items-center justify-center px-1">
                {totalInsights}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="financial" className="text-xs font-mono">Financeiro</TabsTrigger>
          <TabsTrigger value="integration" className="text-xs font-mono">Integração</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><Dashboard /></TabsContent>
        <TabsContent value="insights"><IntegratedInsights /></TabsContent>
        <TabsContent value="financial"><IntelligentFinancialDashboard /></TabsContent>
        <TabsContent value="integration">
          <div className="bg-card border border-border rounded-md p-6">
            <div className="text-xs font-mono text-muted-foreground">
              Sistemas conectados e operando normalmente. Nenhum erro crítico nas últimas 24h.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
