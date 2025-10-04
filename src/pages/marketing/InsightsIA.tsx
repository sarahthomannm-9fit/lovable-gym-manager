import { AIMarketingInsights } from '@/components/marketing/AIMarketingInsights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles } from 'lucide-react';

export function InsightsIA() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Insights de IA para Marketing</h1>
          <p className="text-muted-foreground">
            Análises inteligentes e recomendações automáticas baseadas em seus dados
          </p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Sistema de Análise Inteligente</CardTitle>
          </div>
          <CardDescription>
            Nosso sistema analisa continuamente seus dados de campanhas, produtos, alunos e vendas
            para fornecer insights acionáveis e recomendações personalizadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-background rounded-lg">
              <p className="font-semibold">✓ Análise de Campanhas</p>
              <p className="text-muted-foreground">Otimização automática</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="font-semibold">✓ Segmentação Inteligente</p>
              <p className="text-muted-foreground">Públicos personalizados</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="font-semibold">✓ Previsões de ROI</p>
              <p className="text-muted-foreground">Investimento otimizado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AIMarketingInsights />
    </div>
  );
}