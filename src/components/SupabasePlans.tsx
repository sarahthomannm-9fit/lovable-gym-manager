import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Package } from "lucide-react";
import { AddPlanDialog } from "./plans/AddPlanDialog";
import { PlansStats } from "./plans/PlansStats";
import { PlanCard } from "./plans/PlanCard";
import { PlansOrganization } from "./plans/PlansOrganization";
import { PageShell } from "./warroom/PageShell";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";

export function SupabasePlans() {
  const { plans: supabasePlans, plansLoading, students: supabaseStudents, studentsLoading, addPlan, updatePlan, deletePlan } = useSupabaseGymData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'organization'>('cards');

  const handleAddPlan = async (newPlan: any) => {
    try {
      await addPlan({ nome: newPlan.name, preco: newPlan.price, valor: newPlan.price, duracao_meses: newPlan.duration, beneficios: newPlan.benefits || [], ativo: true, tipo: newPlan.tipo || 'mensal', quantidade_aulas: newPlan.quantidade_aulas || 0 });
      setIsAddDialogOpen(false);
    } catch (error) { console.error('Failed to add plan:', error); }
  };

  const togglePlanStatus = async (planId: string) => {
    try {
      const plan = supabasePlans.find(p => p.id === planId);
      if (plan) await updatePlan(plan.id, { ativo: !(plan.ativo ?? true) });
    } catch (error) { console.error('Failed to toggle plan status:', error); }
  };

  const getStudentsForPlan = (planId: string) => supabaseStudents.filter(s => s.plano_id === planId).length;

  const loading = plansLoading || studentsLoading;
  const ativos = supabasePlans.filter(p => p.ativo).length;
  const avgAlunos = supabasePlans.length > 0 ? (supabaseStudents.length / Math.max(1, ativos)).toFixed(1) : '0';

  const shellMetrics = [
    { label: 'TOTAL', value: String(supabasePlans.length) },
    { label: 'ATIVOS', value: String(ativos), color: 'text-[hsl(var(--urgency-opportunity))]' },
    { label: 'ALUNOS/PLANO', value: avgAlunos },
    { label: 'ALUNOS TOTAL', value: String(supabaseStudents.length) },
  ];

  if (loading) {
    return (
      <PageShell title="PLANOS" sub="Carregando...">
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded" />)}</div>
      </PageShell>
    );
  }

  if (supabasePlans.length === 0) {
    return (
      <PageShell title="PLANOS" sub="Nenhum plano cadastrado">
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-semibold">Crie seu primeiro plano</p>
              <p className="text-sm text-muted-foreground">Defina preços e benefícios para seus alunos.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Plano</Button>
            </CardContent>
          </Card>
        </div>
        <AddPlanDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddPlan={handleAddPlan} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="PLANOS"
      sub={`${ativos} ativos · ${supabaseStudents.length} alunos`}
      metrics={shellMetrics}
      actions={
        <div className="flex gap-1">
          <button onClick={() => setViewMode('cards')} className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${viewMode === 'cards' ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-white/40'}`}>Cards</button>
          <button onClick={() => setViewMode('organization')} className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${viewMode === 'organization' ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-white/40'}`}>Org</button>
          <button onClick={() => setIsAddDialogOpen(true)} className="px-2 py-1 text-[10px] font-mono rounded border border-white/20 text-white/60 hover:text-white transition-colors">+ NOVO</button>
        </div>
      }
    >
      <PlansStats plans={supabasePlans} studentsCount={supabaseStudents.length} />

      <div className="mt-4">
        {viewMode === 'organization' ? (
          <PlansOrganization plans={supabasePlans} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supabasePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} studentsCount={getStudentsForPlan(plan.id)} onToggleStatus={togglePlanStatus} />
            ))}
          </div>
        )}
      </div>

      <AddPlanDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddPlan={handleAddPlan} />
    </PageShell>
  );
}
