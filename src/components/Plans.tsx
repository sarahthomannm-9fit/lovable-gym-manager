
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddPlanDialog } from "./plans/AddPlanDialog";
import { PlansStats } from "./plans/PlansStats";
import { PlanCard } from "./plans/PlanCard";
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

  const getStudentsForPlan = (planName: string) => {
    return students.filter(s => s.plan === planName).length;
  };

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

      <PlansStats plans={plans} students={students} />

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard 
            key={plan.id} 
            plan={plan}
            studentsCount={getStudentsForPlan(plan.name)}
            onToggleStatus={togglePlanStatus}
          />
        ))}
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
