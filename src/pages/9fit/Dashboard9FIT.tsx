import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Dumbbell, 
  Car, 
  Heart, 
  Globe, 
  Workflow, 
  ShoppingBag, 
  Bot,
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
  DollarSign,
  Target,
  Eye
} from "lucide-react";
import { DemoModeToggle } from "@/components/9fit/DemoModeToggle";
import { useDemoMode } from "@/contexts/DemoModeContext";

const quickActions = [
  {
    title: "CEO Dashboard",
    description: "Visão geral completa do negócio",
    icon: LayoutDashboard,
    path: "/9fit/ceo",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    metrics: { label: "MRR", value: "R$ 47.5K", trend: "+12%" }
  },
  {
    title: "Consultoria Fitness",
    description: "Gestão de alunos e treinos",
    icon: Dumbbell,
    path: "/9fit/consultoria",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    metrics: { label: "Alunos Ativos", value: "142", trend: "+8%" }
  },
  {
    title: "Concierge Longevità",
    description: "Serviço premium personalizado",
    icon: Car,
    path: "/9fit/concierge",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    metrics: { label: "Clientes VIP", value: "12", trend: "+3" }
  },
  {
    title: "Trust Layer",
    description: "Avaliações e saúde postural",
    icon: Heart,
    path: "/9fit/trust",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    metrics: { label: "Avaliações", value: "28", trend: "este mês" }
  },
  {
    title: "Network & Marketing",
    description: "Campanhas e captação",
    icon: Globe,
    path: "/9fit/network",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    metrics: { label: "Leads", value: "87", trend: "+24%" }
  },
  {
    title: "Automação",
    description: "Status e fluxos automáticos",
    icon: Workflow,
    path: "/9fit/automation",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    metrics: { label: "Execuções", value: "234", trend: "hoje" }
  },
  {
    title: "Store 9FIT",
    description: "Loja e produtos",
    icon: ShoppingBag,
    path: "/9fit/store",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    metrics: { label: "Vendas", value: "R$ 8.2K", trend: "+18%" }
  },
  {
    title: "Agente IA",
    description: "Assistente inteligente multi-especialista",
    icon: Bot,
    path: "/9fit/agent",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    metrics: { label: "Interações", value: "156", trend: "esta semana" }
  }
];

const layerStatus = [
  { layer: "00_MASTER", status: "verde", completion: 100 },
  { layer: "01_CORE", status: "verde", completion: 95 },
  { layer: "02_EXPERIENCE", status: "amarelo", completion: 78 },
  { layer: "03_TRUST", status: "verde", completion: 88 },
  { layer: "04_AUTOMATION", status: "amarelo", completion: 72 },
  { layer: "05_NETWORK", status: "verde", completion: 91 },
  { layer: "06_STORE", status: "verde", completion: 85 },
  { layer: "07_ADMIN", status: "verde", completion: 93 }
];

const recentActivities = [
  { type: "Novo Aluno", description: "Carlos Silva - Plano Premium", time: "há 15 min", icon: Users },
  { type: "Pagamento", description: "Maria Santos - R$ 350,00", time: "há 32 min", icon: DollarSign },
  { type: "Avaliação", description: "João Costa - Score: 8.5/10", time: "há 1 hora", icon: Target },
  { type: "Agendamento", description: "Concierge - Dr. Paulo Mendes", time: "há 2 horas", icon: Calendar }
];

export default function Dashboard9FIT() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verde": return "bg-green-500";
      case "amarelo": return "bg-yellow-500";
      case "vermelho": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            9FIT OS 🚀
          </h1>
          <p className="text-muted-foreground">
            Sistema Operacional Completo para Gestão de Academia
          </p>
        </div>
        <DemoModeToggle />
      </div>

      {isDemoMode && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Modo Demonstração Ativo
            </CardTitle>
            <CardDescription>
              Você está visualizando dados de exemplo. Nenhuma ação afetará o banco de dados real.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Status dos 7 Layers */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos 7 Layers</CardTitle>
          <CardDescription>Semáforo de implementação do 9FIT OS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {layerStatus.map((layer) => (
              <div key={layer.layer} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(layer.status)}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{layer.layer}</div>
                  <div className="text-xs text-muted-foreground">{layer.completion}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.path}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => navigate(action.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${action.bgColor}`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {action.metrics.trend}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <h3 className="font-semibold text-lg">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{action.metrics.label}</span>
                    <span className="text-sm font-bold">{action.metrics.value}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 47.5K</div>
            <div className="flex items-center gap-1 text-sm text-green-500 mt-2">
              <TrendingUp className="h-4 w-4" />
              <span>+12% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">142</div>
            <div className="flex items-center gap-1 text-sm text-green-500 mt-2">
              <TrendingUp className="h-4 w-4" />
              <span>+8 novos este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">94%</div>
            <div className="flex items-center gap-1 text-sm text-green-500 mt-2">
              <Target className="h-4 w-4" />
              <span>Meta: 90%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Últimas ações no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{activity.type}</div>
                    <div className="text-xs text-muted-foreground">{activity.description}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
