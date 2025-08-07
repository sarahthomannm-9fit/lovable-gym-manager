
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddPlanDialog } from "./plans/AddPlanDialog";
import { PlansStats } from "./plans/PlansStats";
import { PlanCard } from "./plans/PlanCard";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { convertSupabasePlanToOld, convertOldPlanToSupabase } from "@/utils/dataConverters";
import { convertSupabaseStudentToOld } from "@/utils/dataConverters";

export function SupabasePlans() {
  const { 
    plans: supabasePlans, 
    plansLoading, 
    students: supabaseStudents,
    studentsLoading,
    addPlan,
    updatePlan,
    deletePlan
  } = useSupabaseGymData();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Convert Supabase plans to old format for UI compatibility
  const plans = supabasePlans.map(convertSupabasePlanToOld);
  
  // Convert students to old format and create simplified version for stats
  const students = supabaseStudents.map(convertSupabaseStudentToOld);
  const studentsForStats = students.map(student => ({
    id: student.id,
    name: student.name,
    plan: student.plan
  }));

  const handleAddPlan = async (newPlan: any) => {
    try {
      console.log('Adding new plan:', newPlan);
      
      const planData = {
        nome: newPlan.name,
        preco: newPlan.price,
        valor: newPlan.price,
        duracao_meses: newPlan.duration,
        beneficios: newPlan.benefits || [],
        ativo: true
      };

      await addPlan(planData);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add plan:', error);
    }
  };

  const togglePlanStatus = async (planId: number) => {
    try {
      console.log('Toggling plan status:', planId);
      
      // Find the original supabase plan
      const supabasePlan = supabasePlans.find(p => 
        parseInt(p.id.slice(-8), 16) === planId
      );
      
      if (supabasePlan) {
        await updatePlan(supabasePlan.id, {
          ativo: !supabasePlan.ativo
        });
      }
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
    }
  };

  const getStudentsForPlan = (planName: string) => {
    return studentsForStats.filter(s => s.plan === planName).length;
  };

  if (plansLoading || studentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando planos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Planos e Mensalidades (Supabase)
          </h1>
          <p className="text-gray-600 mt-1">Gerencie os planos da sua academia conectados ao banco de dados</p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <PlansStats plans={plans} students={studentsForStats} />

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
