
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { useMemo } from "react";

export function Dashboard() {
  const { 
    students, 
    studentsLoading, 
    payments, 
    paymentsLoading, 
    checkIns, 
    checkInsLoading,
    classes,
    classesLoading
  } = useSupabaseGymData();

  // Calcular métricas baseadas nos dados do Supabase
  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'ativo').length;
    
    // Pagamentos pendentes/atrasados
    const overduePayments = payments.filter(p => 
      p.status === 'pendente' || p.status === 'atrasado'
    ).length;
    
    // Check-ins de hoje
    const today = new Date().toISOString().split('T')[0];
    const todayCheckIns = checkIns.filter(c => 
      c.data_checkin === today || 
      (c.horario_entrada && c.horario_entrada.startsWith(today))
    ).length;
    
    // Receita mensal (pagamentos pagos este mês)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = payments
      .filter(p => {
        if (p.status !== 'pago' || !p.data_pagamento) return false;
        const paymentDate = new Date(p.data_pagamento);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + Number(p.valor), 0);

    // Aulas de hoje
    const todayClasses = classes.filter(c => c.data_aula === today).length;

    // Média de frequência
    const averageAttendance = totalStudents > 0 ? (checkIns.length / totalStudents) * 100 : 0;

    return {
      totalStudents,
      activeStudents,
      overduePayments,
      todayCheckIns,
      monthlyRevenue,
      todayClasses,
      averageAttendance
    };
  }, [students, payments, checkIns, classes]);

  const stats = [
    {
      title: "Total de Alunos",
      value: metrics.totalStudents.toString(),
      change: `${metrics.activeStudents} ativos`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Check-ins Hoje",
      value: metrics.todayCheckIns.toString(),
      change: `${Math.round(metrics.averageAttendance)}% frequência média`,
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Faturamento Mensal",
      value: `R$ ${metrics.monthlyRevenue.toLocaleString()}`,
      change: `${metrics.overduePayments} pagamentos pendentes`,
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      title: "Aulas Hoje",
      value: metrics.todayClasses.toString(),
      change: `${classes.length} aulas cadastradas`,
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  // Próximos vencimentos (próximos 7 dias)
  const upcomingPayments = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return payments
      .filter(p => p.status === 'pendente' && p.data_vencimento)
      .filter(p => {
        const dueDate = new Date(p.data_vencimento);
        return dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
      .slice(0, 5)
      .map(payment => {
        const student = students.find(s => s.id === payment.aluno_id);
        return {
          ...payment,
          studentName: student?.nome || 'Aluno não encontrado'
        };
      });
  }, [payments, students]);

  // Alunos com pagamentos em atraso
  const overdueStudents = useMemo(() => {
    const today = new Date();
    
    return payments
      .filter(p => p.status === 'atrasado' || 
        (p.status === 'pendente' && new Date(p.data_vencimento) < today))
      .slice(0, 5)
      .map(payment => {
        const student = students.find(s => s.id === payment.aluno_id);
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(payment.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          id: payment.id,
          name: student?.nome || 'Aluno não encontrado',
          amount: Number(payment.valor),
          daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
          plan: student?.plano_id ? 'Plano ativo' : 'Sem plano'
        };
      });
  }, [payments, students]);

  if (studentsLoading || paymentsLoading || checkInsLoading || classesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Próximos Vencimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.length > 0 ? (
                upcomingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div>
                      <p className="font-medium text-gray-900">{payment.studentName}</p>
                      <p className="text-sm text-yellow-600">
                        Vence em {new Date(payment.data_vencimento).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      R$ {Number(payment.valor).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum vencimento próximo</p>
                  <p className="text-sm">Todos os pagamentos estão em dia</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Pagamentos em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overdueStudents.length > 0 ? (
                overdueStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-red-600">
                        {student.daysOverdue > 0 ? `${student.daysOverdue} dias em atraso` : 'Vencido'}
                      </p>
                      <p className="text-xs text-gray-500">{student.plan}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      R$ {student.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pagamento em atraso!</p>
                  <p className="text-sm">Todos os pagamentos estão em dia</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
