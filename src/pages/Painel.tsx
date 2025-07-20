
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, CreditCard, TrendingUp, Activity, AlertCircle } from "lucide-react";
import { useGymDashboardMetrics } from "@/hooks/useGymDashboardMetrics";
import { SystemNotifications } from "@/components/SystemNotifications";

export function Painel() {
  const { metrics, loading } = useGymDashboardMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'checkin':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'payment':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case 'registration':
        return <div className="w-2 h-2 bg-purple-500 rounded-full"></div>;
      case 'class':
        return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora mesmo';
    if (diffInMinutes < 60) return `há ${diffInMinutes} minutos`;
    if (diffInMinutes < 1440) return `há ${Math.floor(diffInMinutes / 60)} horas`;
    return `há ${Math.floor(diffInMinutes / 1440)} dias`;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
          <p className="text-muted-foreground">
            Visão geral das atividades da sua academia.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
        <p className="text-muted-foreground">
          Visão geral das atividades da sua academia.
        </p>
      </div>

      {/* Notificações do Sistema */}
      <SystemNotifications />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeStudents} ativos ({metrics.retentionRate}% retenção)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.classesToday}</div>
            <p className="text-xs text-muted-foreground">
              Aulas agendadas para hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Receita do mês atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.retentionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Alunos ativos vs total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Últimas atividades registradas no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.recentActivities.length > 0 ? (
              metrics.recentActivities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-center space-x-4">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.message}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  {index < metrics.recentActivities.length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade recente encontrada
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
            <CardDescription>Alunos por tipo de plano ativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.planDistribution.length > 0 ? (
              metrics.planDistribution.map((plan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{plan.planName}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{plan.studentCount} alunos</Badge>
                    <span className="text-xs text-muted-foreground">({plan.percentage}%)</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum plano ativo encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
