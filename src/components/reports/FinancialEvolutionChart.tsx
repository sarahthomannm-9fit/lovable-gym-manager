
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { FaturamentoMensal, EvolucaoReceita } from "@/hooks/useSupabaseFinancialReports";

interface FinancialEvolutionChartProps {
  faturamentoMensal: FaturamentoMensal[];
  evolucaoReceitas: EvolucaoReceita[];
}

export function FinancialEvolutionChart({ faturamentoMensal, evolucaoReceitas }: FinancialEvolutionChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  // Preparar dados para o gráfico de faturamento
  const faturamentoData = faturamentoMensal.map(item => ({
    mes: formatMonth(item.mes),
    recebido: Number(item.total_recebido),
    pendente: Number(item.total_pendente),
    total: Number(item.total_faturado)
  }));

  // Preparar dados para o gráfico de evolução
  const evolucaoData = evolucaoReceitas.map(item => ({
    mes: item.mes,
    receita: Number(item.receita),
    pagamentos: Number(item.quantidade_pagamentos),
    ticket_medio: Number(item.ticket_medio)
  }));

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Faturamento Mensal (Últimos 6 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={faturamentoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="mes" 
                stroke="#666" 
                fontSize={12}
              />
              <YAxis 
                stroke="#666" 
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'recebido' ? 'Recebido' : 
                  name === 'pendente' ? 'Pendente' : 'Total'
                ]}
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="recebido" 
                stackId="1" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.7}
                name="recebido"
              />
              <Area 
                type="monotone" 
                dataKey="pendente" 
                stackId="1" 
                stroke="#F59E0B" 
                fill="#F59E0B" 
                fillOpacity={0.7}
                name="pendente"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={evolucaoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="mes" 
                stroke="#666" 
                fontSize={12}
              />
              <YAxis 
                stroke="#666" 
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'pagamentos' ? `${value} pagamentos` : formatCurrency(value),
                  name === 'receita' ? 'Receita' : 
                  name === 'pagamentos' ? 'Qtd Pagamentos' : 'Ticket Médio'
                ]}
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="receita" 
                fill="#3B82F6" 
                name="receita"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
