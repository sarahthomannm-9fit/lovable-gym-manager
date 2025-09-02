import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Users, AlertTriangle, Target, 
  CheckCircle, ArrowRight, Lightbulb 
} from 'lucide-react';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useNavigate } from 'react-router-dom';

export function IntegratedInsights() {
  const { insights, loading } = useDataIntegration();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const getInsightIcon = (tipo: string) => {
    switch (tipo) {
      case 'alerta': return AlertTriangle;
      case 'oportunidade': return TrendingUp;
      case 'sugestao': return Lightbulb;
      default: return CheckCircle;
    }
  };

  const getInsightVariant = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'destructive';
      case 'média': return 'secondary';
      case 'baixa': return 'outline';
      default: return 'default';
    }
  };

  const allInsights = [
    ...insights.retencao,
    ...insights.crescimento,
    ...insights.otimizacao
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Insights Integrados</h2>
        <Badge variant="secondary">{allInsights.length} Insights Disponíveis</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allInsights.map((insight, index) => {
          const Icon = getInsightIcon(insight.tipo);
          return (
            <Card key={index} className={`relative ${
              insight.prioridade === 'alta' ? 'border-l-4 border-l-red-500' :
              insight.prioridade === 'média' ? 'border-l-4 border-l-yellow-500' :
              'border-l-4 border-l-blue-500'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Icon className={`h-5 w-5 ${
                    insight.prioridade === 'alta' ? 'text-red-600' :
                    insight.prioridade === 'média' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <Badge variant={getInsightVariant(insight.prioridade)}>
                    {insight.prioridade}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{insight.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {insight.descricao}
                </p>
                
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{insight.acao}</span>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    // Navegar para seção relevante baseada no tipo
                    if (insight.titulo.includes('Retenção')) {
                      navigate('/marketing/comunicacao');
                    } else if (insight.titulo.includes('Crescimento')) {
                      navigate('/marketing/conversao');
                    } else if (insight.titulo.includes('Planos')) {
                      navigate('/planos');
                    } else {
                      navigate('/painel');
                    }
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Implementar Ação
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allInsights.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tudo está otimizado!</h3>
            <p className="text-muted-foreground text-center">
              Não há insights de melhoria disponíveis no momento. Continue o excelente trabalho!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}