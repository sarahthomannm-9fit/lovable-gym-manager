
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddPlanDialog } from "./plans/AddPlanDialog";
import { PlansStats } from "./plans/PlansStats";
import { PlanCard } from "./plans/PlanCard";
import { PlansOrganization } from "./plans/PlansOrganization";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";

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
  const [viewMode, setViewMode] = useState<'cards' | 'organization'>('cards');

  const handleAddPlan = async (newPlan: any) => {
    try {
      const planData = {
        nome: newPlan.name,
        preco: newPlan.price,
        valor: newPlan.price,
        duracao_meses: newPlan.duration,
        beneficios: newPlan.benefits || [],
        ativo: true,
        tipo: newPlan.tipo || 'mensal',
        quantidade_aulas: newPlan.quantidade_aulas || 0,
      };
      await addPlan(planData);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add plan:', error);
    }
  };

  const togglePlanStatus = async (planId: string) => {
    try {
      const plan = supabasePlans.find(p => p.id === planId);
      if (plan) {
        await updatePlan(plan.id, { ativo: !(plan.ativo ?? true) });
      }
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
    }
  };

  const getStudentsForPlan = (planId: string) => {
    return supabaseStudents.filter(s => s.plano_id === planId).length;
  };

  if (plansLoading || studentsLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg">Carregando planos...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Planos e Mensalidades
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie os planos da sua academia</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant={viewMode === 'cards' ? 'default' : 'outline'} onClick={() => setViewMode('cards')}>Cards</Button>
          <Button variant={viewMode === 'organization' ? 'default' : 'outline'} onClick={() => setViewMode('organization')}>Organização</Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      <PlansStats plans={supabasePlans} studentsCount={supabaseStudents.length} />

      {viewMode === 'organization' ? (
        <PlansOrganization plans={supabasePlans} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supabasePlans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan}
              studentsCount={getStudentsForPlan(plan.id)}
              onToggleStatus={togglePlanStatus}
            />
          ))}
        </div>
      )}

      {supabasePlans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum plano cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro plano para começar</p>
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
