
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialMetricsProps {
  monthlyRevenue: number;
  netProfit: number;
  overdue: number;
  averageTicket: number;
}

export function FinancialMetrics({ monthlyRevenue, netProfit, overdue, averageTicket }: FinancialMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-r from-green-50 to-green-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-700">
            Faturamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-800">R$ {monthlyRevenue.toLocaleString()}</div>
          <p className="text-xs text-green-600 mt-1">+18% vs mês anterior</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">
            Lucro Líquido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-800">R$ {netProfit.toLocaleString()}</div>
          <p className="text-xs text-blue-600 mt-1">Margem: 61.4%</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">
            Inadimplência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-800">R$ {overdue.toLocaleString()}</div>
          <p className="text-xs text-purple-600 mt-1">3 alunos em atraso</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-yellow-700">
            Ticket Médio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-800">R$ {averageTicket}</div>
          <p className="text-xs text-yellow-600 mt-1">Por aluno/mês</p>
        </CardContent>
      </Card>
    </div>
  );
}
