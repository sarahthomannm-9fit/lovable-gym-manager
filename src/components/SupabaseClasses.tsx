
import { useState } from "react";
import { MultiDayScheduler } from "./MultiDayScheduler";
import { DailyClassView } from "./DailyClassView";
import { ClassCalendar } from "./ClassCalendar";
import { AddClassDialog } from "./AddClassDialog";
import { ConfirmDialog } from "./ConfirmDialog";
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
        return (
          <DailyClassView
            classes={classItems}
            onConfirmClass={(id: number) => handleConfirmClass(classIdMap[id - 1])}
            onCancelClass={(id: number) => setCancellingId(classIdMap[id - 1])}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Controle de Aulas</h1>
          <p className="text-muted-foreground mt-1">Gerencie aulas individuais e pacotes mensais</p>
        </div>
        <div className="flex space-x-2">
          <AddClassDialog onAddClass={handleAddClass} />
          <Button variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")} className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>Calendário</span></Button>
          <Button variant={view === "daily" ? "default" : "outline"} onClick={() => setView("daily")} className="flex items-center space-x-2"><List className="w-4 h-4" /><span>Aulas Diárias</span></Button>
          <Button variant={view === "packages" ? "default" : "outline"} onClick={() => setView("packages")} className="flex items-center space-x-2"><Grid className="w-4 h-4" /><span>Pacotes Mensais</span></Button>
        </div>
      </div>
      {renderContent()}

      <ConfirmDialog
        open={!!cancellingId}
        onOpenChange={(open) => !open && setCancellingId(null)}
        title="Cancelar Aula"
        description="Tem certeza que deseja cancelar esta aula? Esta ação não pode ser desfeita."
        onConfirm={handleCancelClass}
        confirmLabel="Cancelar Aula"
        variant="destructive"
      />
    </div>
  );
}
