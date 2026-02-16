import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Users, DollarSign, Target, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function CEODashboard() {
  const { metrics, alerts, alunos, planos, pagamentos, alunosPorPlano, faturamentoPorPlano, loading } = useDataIntegration();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg text-muted-foreground">Carregando dashboard CEO...</div></div>;
  }

  const pieData = Object.entries(alunosPorPlano).map(([name, value]) => ({ name, value }));
  const revenueData = Object.entries(faturamentoPorPlano).map(([name, value]) => ({ name, value: Number(value) }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">CEO Dashboard</h1>
        <p className="text-muted-foreground">Visão geral completa do negócio com dados reais</p>
      </div>

      {/* Alertas Urgentes */}
      {alerts.filter(a => a.tipo === 'urgente').length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Alertas Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.filter(a => a.tipo === 'urgente').map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-2 rounded-lg bg-background border">
                <div>
                  <p className="text-sm font-medium">{alert.titulo}</p>
                  <p className="text-xs text-muted-foreground">{alert.descricao}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(alert.rota)}>
                  {alert.acao} <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> MRR (Receita Mensal)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {metrics.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
            <div className={`flex items-center gap-1 text-sm mt-1 ${metrics.crescimentoReceita >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.crescimentoReceita >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{metrics.crescimentoReceita >= 0 ? '+' : ''}{metrics.crescimentoReceita.toFixed(1)}% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Alunos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.alunosAtivos}</div>
            <p className="text-sm text-muted-foreground mt-1">de {metrics.totalAlunos} total | Retenção: {metrics.taxaRetencao.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" /> Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {metrics.ticketMedio.toFixed(0)}</div>
            <p className="text-sm text-muted-foreground mt-1">LTV médio: R$ {metrics.ltvMedio.toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Churn Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.churnRisk.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics.alunosInativos} inativos | {metrics.inadimplencia} inadimplentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alunos por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">CAC Estimado</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.cacEstimado.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Custo de aquisição por cliente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Conversão Experimental</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.taxaConversaoExperimental.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">{metrics.leadsConvertidos} de {metrics.leadsTotal} leads convertidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Inadimplência</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ {metrics.totalInadimplente.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">{metrics.inadimplencia} pagamento(s) vencido(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* Todos os Alertas */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Central de Alertas</CardTitle>
            <CardDescription>Alertas e oportunidades baseados em dados reais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant={alert.tipo === 'urgente' ? 'destructive' : alert.tipo === 'atencao' ? 'secondary' : 'outline'}>
                    {alert.tipo}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{alert.titulo}</p>
                    <p className="text-xs text-muted-foreground">{alert.descricao}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate(alert.rota)}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
