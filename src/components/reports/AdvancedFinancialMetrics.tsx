
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Users, Calendar, CreditCard } from "lucide-react";
import { MetricasGerais, InadimplenciaItem } from "@/hooks/useSupabaseFinancialReports";

interface AdvancedFinancialMetricsProps {
  metricas: MetricasGerais | null;
  inadimplencia: InadimplenciaItem[];
}

export function AdvancedFinancialMetrics({ metricas, inadimplencia }: AdvancedFinancialMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (!metricas) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Receita Mensal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {formatCurrency(metricas.total_receita_mes_atual)}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              {getTrendIcon(metricas.crescimento_percentual)}
              <p className={`text-xs ${getTrendColor(metricas.crescimento_percentual)}`}>
                {formatPercentage(metricas.crescimento_percentual)} vs mês anterior
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Ticket Médio
            </CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {formatCurrency(metricas.ticket_medio)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Alunos Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {metricas.total_alunos_ativos}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Total de alunos ativos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Formas de Pagamento
            </CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {metricas.formas_pagamento_distintas}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Métodos diferentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Inadimplência */}
      {inadimplencia.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              Pagamentos em Atraso ({inadimplencia.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inadimplencia.slice(0, 5).map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="space-y-1">
                      <span className="font-medium text-red-900">{item.aluno_nome}</span>
                      <p className="text-sm text-red-700">
                        {item.plano_nome} - {item.dias_atraso} dias de atraso
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.metodo_pagamento} • {item.telefone}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {formatCurrency(item.valor_em_atraso)}
                    </Badge>
                  </div>
                  {index < Math.min(inadimplencia.length, 5) - 1 && <Separator />}
                </div>
              ))}
              {inadimplencia.length > 5 && (
                <p className="text-sm text-red-600 text-center pt-2">
                  + {inadimplencia.length - 5} outros alunos em atraso
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
