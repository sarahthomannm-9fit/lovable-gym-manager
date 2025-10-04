import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Users, Target, Zap } from 'lucide-react';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AIMarketingInsights() {
  const { campanhas, produtos, alunos, insights } = useDataIntegration();

  // Calcular métricas de marketing
  const campanhasAtivas = campanhas.filter(c => c.status === 'ativa').length;
  const taxaConversao = campanhas.reduce((acc, c) => {
    const conversoes = c.conversoes || 0;
    const alcance = c.alcance || 1;
    return acc + (conversoes / alcance);
  }, 0) / Math.max(campanhas.length, 1) * 100;

  const produtosEmAnalise = produtos.filter(p => p.status === 'analise').length;

  // Insights de IA para marketing
  const marketingInsights = [
    {
      icon: TrendingUp,
      title: 'Otimização de Campanhas',
      description: `${campanhasAtivas} campanhas ativas com taxa média de conversão de ${taxaConversao.toFixed(1)}%`,
      recommendation: taxaConversao < 5 
        ? 'Considere revisar segmentação e mensagens das campanhas'
        : 'Taxa de conversão saudável. Continue monitorando.',
      priority: taxaConversao < 5 ? 'alta' : 'baixa',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Segmentação Inteligente',
      description: `${alunos.length} alunos no banco de dados para segmentação`,
      recommendation: alunos.length > 50
        ? 'Crie campanhas segmentadas por plano e frequência'
        : 'Foque em campanhas de captação de novos alunos',
      priority: 'média',
      color: 'text-green-600'
    },
    {
      icon: Target,
      title: 'Análise de Produtos',
      description: `${produtosEmAnalise} produtos em análise de viabilidade`,
      recommendation: produtosEmAnalise > 0
        ? 'Aguarde análises completarem para criar campanhas otimizadas'
        : 'Cadastre novos produtos para expandir ofertas',
      priority: produtosEmAnalise > 0 ? 'alta' : 'baixa',
      color: 'text-purple-600'
    },
    {
      icon: Zap,
      title: 'Automação Sugerida',
      description: 'Sistema detectou oportunidades de automação',
      recommendation: 'Configure mensagens automáticas para leads e reengajamento',
      priority: 'média',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Insights de Marketing com IA</h2>
      </div>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Análise automática baseada em seus dados. Atualize regularmente para insights precisos.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {marketingInsights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${insight.color}`} />
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                  <Badge 
                    variant={
                      insight.priority === 'alta' ? 'destructive' : 
                      insight.priority === 'média' ? 'default' : 
                      'secondary'
                    }
                  >
                    {insight.priority}
                  </Badge>
                </div>
                <CardDescription>{insight.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Recomendação:</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.recommendation}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Aplicar Sugestão
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insights gerais */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Insights</CardTitle>
            <CardDescription>Análise completa do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{insights.retencao?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Retenção</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{insights.crescimento?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Crescimento</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{insights.otimizacao?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Otimização</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}