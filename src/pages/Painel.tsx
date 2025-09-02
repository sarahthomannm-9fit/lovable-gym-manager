import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dashboard } from '@/components/Dashboard';
import { IntegratedInsights } from '@/components/IntegratedInsights';
import { IntelligentFinancialDashboard } from '@/components/reports/IntelligentFinancialDashboard';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { 
  Users, Calendar, CreditCard, TrendingUp, 
  BarChart3, Target, AlertCircle, CheckCircle,
  Package, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Painel() {
  const navigate = useNavigate();
  const { 
    alunos, planos, campanhas, produtos,
    alunosPorPlano, faturamentoPorPlano, 
    insights, loading, refetchAll 
  } = useDataIntegration();

  const quickStats = [
    {
      title: "Alunos Ativos",
      value: alunos.filter(a => a.status === 'ativo').length,
      total: alunos.length,
      icon: Users,
      color: "text-blue-600",
      onClick: () => navigate('/alunos')
    },
    {
      title: "Planos Disponíveis", 
      value: planos.filter(p => p.ativo).length,
      total: planos.length,
      icon: CreditCard,
      color: "text-green-600",
      onClick: () => navigate('/planos')
    },
    {
      title: "Campanhas Ativas",
      value: campanhas.filter(c => c.status === 'ativa').length,
      total: campanhas.length,
      icon: Target,
      color: "text-purple-600",
      onClick: () => navigate('/marketing/campanhas')
    },
    {
      title: "Produtos Cadastrados",
      value: produtos.filter(p => p.status === 'ativo').length,
      total: produtos.length,
      icon: Package,
      color: "text-orange-600",
      onClick: () => navigate('/produtos')
    }
  ];

  const totalInsights = insights.retencao.length + insights.crescimento.length + insights.otimizacao.length;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header com resumo rápido */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Painel de Controle Inteligente</h1>
          <p className="text-muted-foreground">
            Visão geral integrada com insights de IA e cruzamento de dados
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetchAll} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar Dados
          </Button>
          
          {totalInsights > 0 ? (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {totalInsights} Insights Disponíveis
            </Badge>
          ) : (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Tudo Otimizado
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats Cards Interativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          const percentage = stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0;
          
          return (
            <Card key={index} className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" onClick={stat.onClick}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    de {stat.total} total
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {percentage}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Conteúdo Principal em Abas */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="insights" className="relative">
            Insights IA
            {totalInsights > 0 && (
              <Badge className="ml-2 h-4 w-4 p-0 text-xs" variant="destructive">
                {totalInsights}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="integration">Integração</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Dashboard />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <IntegratedInsights />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <IntelligentFinancialDashboard />
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Plano */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Distribuição de Alunos
                </CardTitle>
                <CardDescription>Alunos por plano ativo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(alunosPorPlano).length > 0 ? (
                    Object.entries(alunosPorPlano).map(([plano, count]) => {
                      const totalAlunos = Object.values(alunosPorPlano).reduce((sum, c) => sum + (c as number), 0);
                      const percentage = totalAlunos > 0 ? Math.round(((count as number) / totalAlunos) * 100) : 0;
                      
                      return (
                        <div key={plano} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">{plano}</span>
                            <p className="text-xs text-muted-foreground">{percentage}% do total</p>
                          </div>
                          <Badge variant="secondary">{count as number} alunos</Badge>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Faturamento por Plano */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Financeira
                </CardTitle>
                <CardDescription>Receita gerada por plano</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(faturamentoPorPlano).length > 0 ? (
                    Object.entries(faturamentoPorPlano).map(([plano, valor]) => {
                      const totalFaturamento = Object.values(faturamentoPorPlano).reduce((sum, v) => sum + (v as number), 0);
                      const percentage = totalFaturamento > 0 ? Math.round(((valor as number) / totalFaturamento) * 100) : 0;
                      
                      return (
                        <div key={plano} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">{plano}</span>
                            <p className="text-xs text-muted-foreground">{percentage}% da receita</p>
                          </div>
                          <span className="font-semibold text-green-600">
                            R$ {(valor as number).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumo de Campanhas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Status das Campanhas
                </CardTitle>
                <CardDescription>Campanhas de marketing ativas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campanhas.length > 0 ? (
                    <>
                      {['ativa', 'pausada', 'finalizada'].map(status => {
                        const count = campanhas.filter(c => c.status === status).length;
                        if (count === 0) return null;
                        
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">{status}s</span>
                            <Badge 
                              variant={status === 'ativa' ? 'default' : status === 'pausada' ? 'secondary' : 'outline'}
                            >
                              {count}
                            </Badge>
                          </div>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => navigate('/marketing/campanhas')}
                      >
                        Ver Todas as Campanhas
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">Nenhuma campanha criada</p>
                      <Button size="sm" onClick={() => navigate('/produtos')}>
                        Criar Produto e Campanha
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Produtos Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos Cadastrados
                </CardTitle>
                <CardDescription>Status dos produtos no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {produtos.length > 0 ? (
                    <>
                      {['ativo', 'analise', 'inativo'].map(status => {
                        const count = produtos.filter(p => p.status === status).length;
                        if (count === 0) return null;
                        
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {status === 'analise' ? 'Em Análise' : status}s
                            </span>
                            <Badge 
                              variant={status === 'ativo' ? 'default' : status === 'analise' ? 'secondary' : 'outline'}
                            >
                              {count}
                            </Badge>
                          </div>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => navigate('/produtos')}
                      >
                        Gerenciar Produtos
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">Nenhum produto cadastrado</p>
                      <Button size="sm" onClick={() => navigate('/produtos')}>
                        Cadastrar Primeiro Produto
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}