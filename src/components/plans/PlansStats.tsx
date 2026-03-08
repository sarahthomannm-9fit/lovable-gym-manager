
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Calendar } from "lucide-react";
import { SupabasePlan } from "@/hooks/useSupabasePlans";

type PlanType = SupabasePlan;

interface PlansStatsProps {
  plans: SupabasePlan[];
  studentsCount: number;
}

export function PlansStats({ plans, studentsCount }: PlansStatsProps) {
  const activePlans = plans.filter(p => p.ativo ?? true);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Planos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activePlans.length}</div>
          <p className="text-xs text-muted-foreground mt-1">De {plans.length} planos criados</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Total de Alunos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{studentsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Alunos vinculados</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Ticket Médio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {activePlans.length > 0 
              ? (activePlans.reduce((s, p) => s + Number(p.preco), 0) / activePlans.length).toFixed(0) 
              : '0'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Preço médio dos planos ativos</p>
        </CardContent>
      </Card>
    </div>
  );
}
