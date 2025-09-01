import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, 
  Lightbulb, BarChart3, PieChart, Activity 
} from 'lucide-react';
import { useSupabaseAdvancedFinancial } from '@/hooks/useSupabaseAdvancedFinancial';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function IntelligentFinancialDashboard() {
  const { analiseAvancada, projecoesCenarios, loading } = useSupabaseAdvancedFinancial();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const dadosGraficos = analiseAvancada.map(item => ({
    periodo: item.periodo,
    atual: parseFloat(item.receita_atual.toString()),
    projetada: parseFloat(item.receita_projetada.toString()),
    crescimento: parseFloat(item.taxa_crescimento.toString())
  }));

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'ALTO': return 'destructive';
      case 'MÉDIO': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Insights Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {analiseAvancada.slice(0, 1).map((item, index) => (
          <React.Fragment key={index}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Atual</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {item.receita_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.taxa_crescimento > 0 ? '+' : ''}{item.taxa_crescimento.toFixed(1)}% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projeção</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {item.receita_projetada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Próximo mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Variabilidade</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {item.variabilidade.toFixed(1)}%
                </div>
                <Progress value={Math.min(item.variabilidade, 100)} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risco</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant={getRiscoColor(item.risco_inadimplencia)}>
                  {item.risco_inadimplencia}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Inadimplência
                </p>
              </CardContent>
            </Card>
          </React.Fragment>
        ))}
      </div>

      <Tabs defaultValue="analise" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analise">Análise Inteligente</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
          <TabsTrigger value="estrategias">Estratégias</TabsTrigger>
          <TabsTrigger value="recomendacoes">Recomendações</TabsTrigger>
        </TabsList>

        <TabsContent value="analise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolução da Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dadosGraficos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      ''
                    ]}
                  />
                  <Area type="monotone" dataKey="atual" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="projetada" stackId="2" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projecoes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projecoesCenarios.map((cenario) => (
              <Card key={cenario.cenario}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Cenário {cenario.cenario}
                    <Badge variant={
                      cenario.cenario === 'Conservador' ? 'secondary' :
                      cenario.cenario === 'Moderado' ? 'default' : 'destructive'
                    }>
                      ROI {cenario.roi_estimado}x
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">3 meses</p>
                    <p className="text-lg font-semibold">
                      R$ {cenario.receita_projetada_3m.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">12 meses</p>
                    <p className="text-lg font-semibold">
                      R$ {cenario.receita_projetada_12m.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Investimento Necessário</p>
                    <p className="text-base font-medium text-orange-600">
                      R$ {cenario.investimento_necessario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="estrategias" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analiseAvancada.slice(0, 2).map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Estratégias de Retenção - {item.periodo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {item.estrategias_retencao.map((estrategia: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{estrategia.estrategia}</p>
                        </div>
                        <Badge variant={
                          estrategia.prioridade === 'alta' ? 'destructive' :
                          estrategia.prioridade === 'média' ? 'secondary' : 'default'
                        }>
                          {estrategia.prioridade}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recomendacoes" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {analiseAvancada.slice(0, 3).map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Recomendações Inteligentes - {item.periodo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {item.recomendacoes.map((rec: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-4 border rounded-lg">
                        <Badge variant="outline" className="mt-0.5">
                          {rec.tipo}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{rec.acao}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Implementar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}