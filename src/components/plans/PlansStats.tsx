
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Calendar } from "lucide-react";
import { Plan, Student } from "@/types/gym";

interface PlansStatsProps {
  plans: Plan[];
  students: Student[];
}

export function PlansStats({ plans, students }: PlansStatsProps) {
  const getStudentsForPlan = (planName: string) => {
    return students.filter(s => s.plan === planName).length;
  };

  const totalRevenue = plans.reduce((sum, plan) => {
    const studentsCount = getStudentsForPlan(plan.name);
    return sum + (plan.price * studentsCount);
  }, 0);

  const totalStudents = students.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Receita Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-800">R$ {totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-blue-600 mt-1">Receita mensal dos planos</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-700 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Total de Alunos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-800">{totalStudents}</div>
          <p className="text-xs text-green-600 mt-1">Alunos ativos</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Planos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-800">{plans.filter(p => p.active).length}</div>
          <p className="text-xs text-purple-600 mt-1">De {plans.length} planos criados</p>
        </CardContent>
      </Card>
    </div>
  );
}
