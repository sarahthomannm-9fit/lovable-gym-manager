
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, DollarSign, Calendar } from "lucide-react";
import { AddPlanDialog } from "./plans/AddPlanDialog";
import { useGymData } from "@/contexts/GymDataContext";

export function Plans() {
  const { plans, students, addPlan, updatePlan } = useGymData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddPlan = (newPlan: any) => {
    addPlan({
      name: newPlan.name,
      price: newPlan.price,
      duration: newPlan.duration,
      benefits: newPlan.benefits,
      active: true
    });
  };

  const togglePlanStatus = (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      updatePlan(planId, { active: !plan.active });
    }
  };

  // Calculate students per plan
  const getStudentsForPlan = (planName: string) => {
    return students.filter(s => s.plan === planName).length;
  };

  const totalRevenue = plans.reduce((sum, plan) => {
    const studentsCount = getStudentsForPlan(plan.name);
    return sum + (plan.price * studentsCount);
  }, 0);

  const totalStudents = students.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Planos e Mensalidades
          </h1>
          <p className="text-gray-600 mt-1">Gerencie os planos da sua academia</p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Métricas Gerais */}
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

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const studentsCount = getStudentsForPlan(plan.name);
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
          const planColor = colors[plan.id % colors.length];
          
          return (
            <Card key={plan.id} className={`relative overflow-hidden ${!plan.active ? 'opacity-60' : ''}`}>
              <div className={`h-2 ${planColor}`} />
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <Badge variant={plan.active ? "default" : "secondary"}>
                    {plan.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-primary">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-gray-500 ml-1">/{plan.duration === 1 ? 'mês' : `${plan.duration} meses`}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Benefícios:</h4>
                  <ul className="space-y-1">
                    {plan.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    {studentsCount} alunos
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePlanStatus(plan.id)}
                    >
                      {plan.active ? "Desativar" : "Ativar"}
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum plano cadastrado</p>
          <p className="text-sm text-gray-400 mt-1">Crie seu primeiro plano para começar</p>
        </div>
      )}

      <AddPlanDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddPlan={handleAddPlan}
      />
    </div>
  );
}
