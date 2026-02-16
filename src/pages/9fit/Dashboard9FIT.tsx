import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import { 
  LayoutDashboard, Dumbbell, Car, Heart, Globe, Workflow, ShoppingBag, Bot,
  Users, TrendingUp, TrendingDown, Calendar, DollarSign, Target, Eye
} from "lucide-react";
import { DemoModeToggle } from "@/components/9fit/DemoModeToggle";
import { useDemoMode } from "@/contexts/DemoModeContext";

export default function Dashboard9FIT() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const { metrics, alerts, loading } = useDataIntegration();

  const quickActions = [
    { title: "CEO Dashboard", description: "Visão geral completa do negócio", icon: LayoutDashboard, path: "/9fit/ceo", color: "text-blue-500", bgColor: "bg-blue-500/10",
      metrics: { label: "MRR", value: `R$ ${(metrics.receitaMensal / 1000).toFixed(1)}K`, trend: `${metrics.crescimentoReceita >= 0 ? '+' : ''}${metrics.crescimentoReceita.toFixed(0)}%` } },
    { title: "Consultoria Fitness", description: "Gestão de alunos e treinos", icon: Dumbbell, path: "/9fit/consultoria", color: "text-orange-500", bgColor: "bg-orange-500/10",
      metrics: { label: "Alunos Ativos", value: `${metrics.alunosAtivos}`, trend: `${metrics.churnRisk.length} em risco` } },
    { title: "Concierge Longevità", description: "Serviço premium personalizado", icon: Car, path: "/9fit/concierge", color: "text-purple-500", bgColor: "bg-purple-500/10",
      metrics: { label: "LTV Médio", value: `R$ ${metrics.ltvMedio.toFixed(0)}`, trend: "premium" } },
    { title: "Trust Layer", description: "Avaliações e saúde postural", icon: Heart, path: "/9fit/trust", color: "text-red-500", bgColor: "bg-red-500/10",
      metrics: { label: "Pendentes", value: `${metrics.alunosComAvaliacaoPendente}`, trend: "avaliações" } },
    { title: "Network & Marketing", description: "Campanhas e captação", icon: Globe, path: "/9fit/network", color: "text-green-500", bgColor: "bg-green-500/10",
      metrics: { label: "Leads", value: `${metrics.leadsTotal}`, trend: `${metrics.taxaConversaoExperimental.toFixed(0)}% conv.` } },
    { title: "Automação", description: "Fluxos automáticos", icon: Workflow, path: "/9fit/automation", color: "text-cyan-500", bgColor: "bg-cyan-500/10",
      metrics: { label: "Alertas", value: `${alerts.length}`, trend: "ativos" } },
    { title: "Store 9FIT", description: "Loja e produtos", icon: ShoppingBag, path: "/9fit/store", color: "text-yellow-500", bgColor: "bg-yellow-500/10",
      metrics: { label: "Ticket Médio", value: `R$ ${metrics.ticketMedio.toFixed(0)}`, trend: "vendas" } },
    { title: "Agente IA", description: "Assistente inteligente", icon: Bot, path: "/agente-ia", color: "text-pink-500", bgColor: "bg-pink-500/10",
      metrics: { label: "Disponível", value: "24/7", trend: "online" } },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">9FIT OS 🚀</h1>
          <p className="text-muted-foreground">Sistema Operacional Completo para Gestão de Academia</p>
        </div>
        <DemoModeToggle />
      </div>

      {isDemoMode && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Modo Demonstração Ativo</CardTitle>
            <CardDescription>Dados de exemplo. Nenhuma ação afetará o banco de dados real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Ações Rápidas com dados reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.path} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => navigate(action.path)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${action.bgColor}`}><Icon className={`h-6 w-6 ${action.color}`} /></div>
                  <Badge variant="outline" className="text-xs">{action.metrics.trend}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <h3 className="font-semibold text-lg">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{action.metrics.label}</span>
                    <span className="text-sm font-bold">{loading ? '...' : action.metrics.value}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Métricas Reais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {loading ? '...' : metrics.receitaMensal.toLocaleString('pt-BR')}</div>
            <div className={`flex items-center gap-1 text-sm mt-2 ${metrics.crescimentoReceita >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {metrics.crescimentoReceita >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{metrics.crescimentoReceita >= 0 ? '+' : ''}{metrics.crescimentoReceita.toFixed(1)}% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Alunos Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : metrics.alunosAtivos}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <Users className="h-4 w-4" /><span>de {metrics.totalAlunos} total | {metrics.alunosInativos} inativos</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Retenção</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : `${metrics.taxaRetencao.toFixed(0)}%`}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <Target className="h-4 w-4" /><span>Inadimplência: R$ {metrics.totalInadimplente.toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Inteligentes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas Inteligentes ({alerts.length})</CardTitle>
            <CardDescription>Baseados em dados reais cruzados do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 6).map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate(alert.rota)}>
                <div className="flex items-center gap-3">
                  <Badge variant={alert.tipo === 'urgente' ? 'destructive' : alert.tipo === 'atencao' ? 'secondary' : 'outline'}>{alert.tipo}</Badge>
                  <div>
                    <p className="text-sm font-medium">{alert.titulo}</p>
                    <p className="text-xs text-muted-foreground">{alert.descricao}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
