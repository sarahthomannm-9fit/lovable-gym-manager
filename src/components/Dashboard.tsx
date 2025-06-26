
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";

export function Dashboard() {
  const stats = [
    {
      title: "Total de Alunos",
      value: "47",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Aulas Este Mês",
      value: "156",
      change: "+8%",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Faturamento",
      value: "R$ 12.450",
      change: "+23%",
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      title: "Taxa de Frequência",
      value: "87%",
      change: "+5%",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Visão geral do seu negócio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-green-600 font-medium mt-1">
                {stat.change} em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Próximas Aulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "João Silva", time: "09:00", type: "Musculação" },
                { name: "Maria Santos", time: "10:30", type: "Funcional" },
                { name: "Pedro Costa", time: "14:00", type: "HIIT" },
              ].map((aula, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{aula.name}</p>
                    <p className="text-sm text-gray-600">{aula.type}</p>
                  </div>
                  <span className="text-sm font-medium text-blue-600">{aula.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Ana Paula", value: "R$ 200,00", days: "3 dias" },
                { name: "Carlos Oliveira", value: "R$ 150,00", days: "7 dias" },
                { name: "Lucia Ferreira", value: "R$ 300,00", days: "1 dia" },
              ].map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="font-medium text-gray-900">{payment.name}</p>
                    <p className="text-sm text-red-600">Vence em {payment.days}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{payment.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
