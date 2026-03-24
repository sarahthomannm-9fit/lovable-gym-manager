import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dashboard } from '@/components/Dashboard';
import { IntegratedInsights } from '@/components/IntegratedInsights';
import { IntelligentFinancialDashboard } from '@/components/reports/IntelligentFinancialDashboard';
import { PainelAluno } from '@/components/PainelAluno';
import { EventsTimeline } from '@/components/EventsTimeline';
import { DailyActionRecommendations } from '@/components/DailyActionRecommendations';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { 
  Users, CreditCard, TrendingUp, 
  BarChart3, Target, AlertCircle, CheckCircle,
  Package, RefreshCw, AlertTriangle, DollarSign, UserCheck,
  Activity, Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Painel() {
  const navigate = useNavigate();
  const { role } = useCurrentUserRole();
  const { 
    alunos, planos, campanhas, produtos,
    alunosPorPlano, faturamentoPorPlano, 
    insights, loading, refetchAll 
  } = useDataIntegration();
  const { alerts, metrics } = useDataIntegration();

  // Aluno role gets a simplified dashboard
  if (role === 'user') {
    return <PainelAluno />;
  }

  // MRR calculation (Monthly Recurring Revenue)
  const mrr = metrics?.receitaMensal || 0;
  const churnRate = metrics?.totalAlunos ? ((metrics?.alunosInativos || 0) / metrics.totalAlunos * 100) : 0;

  const quickStats = [
    { title: "MRR", value: `R$ ${mrr.toLocaleString('pt-BR')}`, subtitle: metrics?.crescimentoReceita ? `${metrics.crescimentoReceita > 0 ? '+' : ''}${metrics.crescimentoReceita.toFixed(1)}%` : undefined, icon: DollarSign, color: "text-green-600", onClick: () => navigate('/relatorios') },
    { title: "Alunos Ativos", value: alunos.filter(a => a.status === 'ativo').length, total: alunos.length, icon: Users, color: "text-blue-600", onClick: () => navigate('/alunos') },
    { title: "Churn", value: `${churnRate.toFixed(1)}%`, subtitle: `${metrics?.alunosInativos || 0} inativos`, icon: Percent, color: churnRate > 10 ? "text-red-600" : "text-amber-600", onClick: () => navigate('/alunos') },
    { title: "Inadimplência", value: `R$ ${(metrics?.totalInadimplente || 0).toLocaleString('pt-BR')}`, subtitle: `${metrics?.inadimplencia || 0} vencido(s)`, icon: AlertTriangle, color: "text-red-600", onClick: () => navigate('/pagamentos') },
    { title: "Conversão", value: metrics?.taxaConversaoExperimental ? `${metrics.taxaConversaoExperimental.toFixed(0)}%` : '0%', subtitle: "Experimental → Aluno", icon: UserCheck, color: "text-emerald-600", onClick: () => navigate('/experimentais') },
    { title: "LTV Médio", value: `R$ ${(metrics?.ltvMedio || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, subtitle: `Ticket: R$ ${(metrics?.ticketMedio || 0).toFixed(0)}`, icon: TrendingUp, color: "text-purple-600", onClick: () => navigate('/relatorios') },
  ];

  const totalInsights = insights.retencao.length + insights.crescimento.length + insights.otimizacao.length;
  const criticalAlerts = alerts.filter(a => a.tipo === 'urgente');

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Control Plane</h1>
          <p className="text-muted-foreground">Centro de comando — métricas executivas e alertas inteligentes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetchAll} className="gap-2"><RefreshCw className="h-4 w-4" />Atualizar</Button>
          {criticalAlerts.length > 0 && <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />{criticalAlerts.length} alertas críticos</Badge>}
        </div>
      </div>

      {/* Daily Action Recommendations */}
      <DailyActionRecommendations />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" onClick={stat.onClick}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{stat.title}</CardTitle><Icon className={`h-5 w-5 ${stat.color}`} /></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.total != null && typeof stat.value === 'number' && <p className="text-xs text-muted-foreground">de {stat.total} total</p>}
                {(stat as any).subtitle && <p className="text-xs text-muted-foreground">{(stat as any).subtitle}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" />Alertas Inteligentes ({alerts.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.slice(0, 8).map((alert, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => alert.rota && navigate(alert.rota)}>
                  <Badge variant={alert.tipo === 'urgente' ? 'destructive' : alert.tipo === 'atencao' ? 'default' : 'secondary'} className="text-xs shrink-0">{alert.tipo === 'urgente' ? 'Urgente' : alert.tipo === 'atencao' ? 'Atenção' : 'Info'}</Badge>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium">{alert.titulo}</p><p className="text-xs text-muted-foreground truncate">{alert.descricao}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Timeline */}
      <EventsTimeline limit={15} />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="insights" className="relative">Insights IA{totalInsights > 0 && <Badge className="ml-2 h-4 w-4 p-0 text-xs" variant="destructive">{totalInsights}</Badge>}</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="integration">Integração</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><Dashboard /></TabsContent>
        <TabsContent value="insights"><IntegratedInsights /></TabsContent>
        <TabsContent value="financial"><IntelligentFinancialDashboard /></TabsContent>
        <TabsContent value="integration">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Distribuição de Alunos</CardTitle><CardDescription>Alunos por plano ativo</CardDescription></CardHeader><CardContent><div className="space-y-3">{Object.entries(alunosPorPlano).length > 0 ? Object.entries(alunosPorPlano).map(([plano, count]) => { const totalAlunos = Object.values(alunosPorPlano).reduce((sum, c) => sum + (c as number), 0); const percentage = totalAlunos > 0 ? Math.round(((count as number) / totalAlunos) * 100) : 0; return (<div key={plano} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><div><span className="text-sm font-medium">{plano}</span><p className="text-xs text-muted-foreground">{percentage}% do total</p></div><Badge variant="secondary">{count as number} alunos</Badge></div>); }) : <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Performance Financeira</CardTitle><CardDescription>Receita por plano</CardDescription></CardHeader><CardContent><div className="space-y-3">{Object.entries(faturamentoPorPlano).length > 0 ? Object.entries(faturamentoPorPlano).map(([plano, valor]) => (<div key={plano} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">{plano}</span><span className="font-semibold text-green-600">R$ {(valor as number).toLocaleString('pt-BR')}</span></div>)) : <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Campanhas</CardTitle></CardHeader><CardContent><div className="space-y-3">{campanhas.length > 0 ? (<>{['ativa', 'pausada', 'finalizada'].map(status => { const count = campanhas.filter(c => c.status === status).length; if (count === 0) return null; return <div key={status} className="flex items-center justify-between"><span className="text-sm capitalize">{status}s</span><Badge variant={status === 'ativa' ? 'default' : 'secondary'}>{count}</Badge></div>; })}<Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate('/marketing/campanhas')}>Ver Campanhas</Button></>) : <div className="text-center py-4"><p className="text-muted-foreground">Nenhuma campanha</p></div>}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Produtos</CardTitle></CardHeader><CardContent><div className="space-y-3">{produtos.length > 0 ? (<>{['ativo', 'analise', 'inativo'].map(status => { const count = produtos.filter(p => p.status === status).length; if (count === 0) return null; return <div key={status} className="flex items-center justify-between"><span className="text-sm capitalize">{status === 'analise' ? 'Em Análise' : status}s</span><Badge variant={status === 'ativo' ? 'default' : 'secondary'}>{count}</Badge></div>; })}<Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate('/produtos')}>Gerenciar</Button></>) : <div className="text-center py-4"><p className="text-muted-foreground">Nenhum produto</p></div>}</div></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
