
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { useGymData } from "@/contexts/GymDataContext";

export function Dashboard() {
  const { metrics, students, classes, payments } = useGymData();

  const stats = [
    {
      title: "Total de Alunos",
      value: metrics.totalStudents.toString(),
      change: metrics.activeStudents > 0 ? `${metrics.activeStudents} ativos` : "Sem alunos",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Aulas Este Mês",
      value: metrics.totalClasses.toString(),
      change: `${Math.round(metrics.classAttendanceRate)}% ocupação`,
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Faturamento",
      value: `R$ ${metrics.monthlyRevenue.toLocaleString()}`,
      change: metrics.overduePayments > 0 ? `R$ ${metrics.overduePayments.toLocaleString()} em atraso` : "Em dia",
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      title: "Taxa de Frequência",
      value: `${Math.round(metrics.averageAttendance)}%`,
      change: `${metrics.equipmentInMaintenance} equipamentos em manutenção`,
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  // Próximas aulas baseadas nos dados reais
  const upcomingClasses = classes
    .filter(c => new Date(`${c.date} ${c.time}`) > new Date())
    .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
    .slice(0, 3);

  // Pagamentos pendentes baseados nos dados reais
  const overdueStudents = students
    .filter(s => s.paymentStatus === 'overdue')
    .slice(0, 3);

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
              {upcomingClasses.length > 0 ? (
                upcomingClasses.map((aula) => (
                  <div key={aula.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{aula.name}</p>
                      <p className="text-sm text-gray-600">{aula.type}</p>
                      <p className="text-xs text-gray-500">{aula.enrolled}/{aula.capacity} inscritos</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-blue-600">{aula.time}</span>
                      <p className="text-xs text-gray-500">{new Date(aula.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma aula agendada</p>
                  <p className="text-sm">Adicione aulas para visualizá-las aqui</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overdueStudents.length > 0 ? (
                overdueStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-red-600">
                        {student.daysOverdue ? `${student.daysOverdue} dias em atraso` : 'Pagamento pendente'}
                      </p>
                      <p className="text-xs text-gray-500">{student.plan}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      R$ {student.monthlyPayment.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Todos os pagamentos em dia!</p>
                  <p className="text-sm">Nenhum pagamento pendente encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
