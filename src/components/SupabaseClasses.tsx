import { useState } from "react";
import { MultiDayScheduler } from "./MultiDayScheduler";
import { DailyClassView } from "./DailyClassView";
import { ClassCalendar } from "./ClassCalendar";
import { AddClassDialog } from "./AddClassDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { PageShell } from "./warroom/PageShell";
import { Button } from "@/components/ui/button";
import { Grid, List, Calendar } from "lucide-react";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";

type ViewType = "calendar" | "daily" | "packages";

export function SupabaseClasses() {
  const { classes, addClass, updateClass } = useSupabaseGymData();
  const [view, setView] = useState<ViewType>("calendar");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleAddClass = async (classData: any) => {
    try { await addClass(classData); } catch (error) { console.error('Failed to add class:', error); }
  };
  const handleConfirmClass = async (id: string) => {
    try { await updateClass(id, { status: 'confirmada' }); } catch (error) { console.error('Failed to confirm class:', error); }
  };
  const handleCancelClass = async () => {
    if (!cancellingId) return;
    try { await updateClass(cancellingId, { status: 'cancelada' }); } catch (error) { console.error('Failed to cancel class:', error); }
    setCancellingId(null);
  };

  const hojeStr = new Date().toISOString().split('T')[0];
  const aulasHoje = classes.filter(a => a.data_aula === hojeStr);
  const semInstrutor = classes.filter(a => !a.professor_id && a.data_aula >= hojeStr);
  const ocupTotal = classes.length > 0 ? classes.reduce((s, a) => s + ((a as any).inscritos_atual || 0), 0) : 0;
  const capTotal = classes.length > 0 ? classes.reduce((s, a) => s + (a.capacidade_maxima || 20), 0) : 0;
  const ocupPct = capTotal > 0 ? (ocupTotal / capTotal * 100) : 0;

  const shellMetrics = [
    { label: 'HOJE', value: String(aulasHoje.length) },
    { label: 'TOTAL AULAS', value: String(classes.length) },
    { label: 'OCUPAÇÃO', value: `${ocupPct.toFixed(0)}%`, color: ocupPct < 30 ? 'text-[hsl(var(--urgency-attention))]' : undefined },
    { label: 'SEM INSTRUTOR', value: String(semInstrutor.length), color: semInstrutor.length > 0 ? 'text-[hsl(var(--urgency-critical))]' : undefined },
  ];

  const classItems = classes.map((c, idx) => ({
    id: idx + 1,
    student: c.nome || 'N/A',
    date: c.data_aula,
    time: c.horario_inicio,
    type: c.tipo || c.nome,
    status: (c as any).status === 'confirmada' ? 'Confirmada' : (c as any).status === 'cancelada' ? 'Cancelada' : 'Agendada',
  }));
  const classIdMap = classes.map(c => c.id);

  const renderContent = () => {
    switch (view) {
      case "calendar": return <ClassCalendar />;
      case "packages": return <MultiDayScheduler />;
      case "daily":
      default:
        return <DailyClassView classes={classItems} onConfirmClass={(id: number) => handleConfirmClass(classIdMap[id - 1])} onCancelClass={(id: number) => setCancellingId(classIdMap[id - 1])} />;
    }
  };

  return (
    <PageShell 
      title="CONTROLE DE AULAS" 
      sub="Agenda e pacotes"
      criticals={semInstrutor.length > 0 ? semInstrutor.length : undefined}
      metrics={shellMetrics}
      actions={
        <div className="flex gap-1">
          {[
            { v: 'calendar' as const, icon: Calendar, label: 'Cal' },
            { v: 'daily' as const, icon: List, label: 'Dia' },
            { v: 'packages' as const, icon: Grid, label: 'Pac' },
          ].map(btn => (
            <button key={btn.v} onClick={() => setView(btn.v)}
              className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${view === btn.v ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-white/40 hover:text-white/70'}`}>
              {btn.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-4"><AddClassDialog onAddClass={handleAddClass} /></div>
      {renderContent()}
      <ConfirmDialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)} title="Cancelar Aula" description="Cancelar esta aula? Alunos serão notificados." onConfirm={handleCancelClass} confirmLabel="Cancelar Aula" variant="destructive" />
    </PageShell>
  );
}
