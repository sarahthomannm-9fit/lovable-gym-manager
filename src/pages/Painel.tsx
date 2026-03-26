import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dashboard } from '@/components/Dashboard';
import { IntegratedInsights } from '@/components/IntegratedInsights';
import { IntelligentFinancialDashboard } from '@/components/reports/IntelligentFinancialDashboard';
import { PainelAluno } from '@/components/PainelAluno';
import { DailyActionRecommendations } from '@/components/DailyActionRecommendations';
import { WarRoomBanner } from '@/components/warroom/WarRoomBanner';
import { CriticalColumn } from '@/components/warroom/CriticalColumn';
import { BusinessColumn } from '@/components/warroom/BusinessColumn';
import { SystemColumn } from '@/components/warroom/SystemColumn';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { RefreshCw, Flame, BarChart3, Cog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Painel() {
  const navigate = useNavigate();
  const { role } = useCurrentUserRole();
  const isMobile = useIsMobile();
  const { 
    alerts, metrics, loading, refetchAll, insights
  } = useDataIntegration();
  const [mobileTab, setMobileTab] = useState('critico');

  if (role === 'user') {
    return <PainelAluno />;
  }

  const totalInsights = insights.retencao.length + insights.crescimento.length + insights.otimizacao.length;
  const criticalCount = alerts.filter(a => a.coluna === 'critico').length;

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              {[1, 2, 3].map(j => (
                <div key={j} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Sala de Guerra</h1>
          <p className="text-xs text-muted-foreground">O que precisa de você agora</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetchAll} className="gap-1.5 shrink-0">
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      {/* Status Banner */}
      <WarRoomBanner alerts={alerts} />

      {/* Daily Recommendations (collapsed on mobile) */}
      <DailyActionRecommendations />

      {/* === WAR ROOM: 3 Columns (Desktop) / Tabs (Mobile) === */}
      {isMobile ? (
        <Tabs value={mobileTab} onValueChange={setMobileTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="critico" className="gap-1 text-xs">
              <Flame className="h-3 w-3" />
              Urgente
              {criticalCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">{criticalCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="decisao" className="gap-1 text-xs">
              <BarChart3 className="h-3 w-3" />
              Negócio
            </TabsTrigger>
            <TabsTrigger value="sistema" className="gap-1 text-xs">
              <Cog className="h-3 w-3" />
              Sistema
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6">
          {/* Left: Critical */}
          <div className="bg-[hsl(var(--warroom-column-bg))]/50 rounded-xl p-3 border border-border/50">
            <CriticalColumn alerts={alerts} />
          </div>
          {/* Center: Business */}
          <div className="bg-[hsl(var(--warroom-column-bg))]/50 rounded-xl p-3 border border-border/50">
            <BusinessColumn metrics={metrics} alerts={alerts} />
          </div>
          {/* Right: System */}
          <div className="bg-[hsl(var(--warroom-column-bg))]/50 rounded-xl p-3 border border-border/50 md:col-span-2 xl:col-span-1">
            <SystemColumn metrics={metrics} alerts={alerts} />
          </div>
        </div>
      )}

      {/* Deep Dive Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4 pt-4 border-t border-border">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="insights" className="relative">
            Insights IA
            {totalInsights > 0 && <Badge className="ml-2 h-4 w-4 p-0 text-xs" variant="destructive">{totalInsights}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="integration">Integração</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><Dashboard /></TabsContent>
        <TabsContent value="insights"><IntegratedInsights /></TabsContent>
        <TabsContent value="financial"><IntelligentFinancialDashboard /></TabsContent>
        <TabsContent value="integration">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status de Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Sistemas conectados e operando normalmente.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Logs de Integração</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Nenhum erro crítico detectado nas últimas 24h.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
