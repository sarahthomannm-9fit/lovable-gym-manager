
import { useState } from "react";
import { MultiDayScheduler } from "./MultiDayScheduler";
import { DailyClassView } from "./DailyClassView";
import { ClassCalendar } from "./ClassCalendar";
import { AddClassDialog } from "./AddClassDialog";
import { Button } from "@/components/ui/button";
import { Grid, List, Calendar } from "lucide-react";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";

type ViewType = "calendar" | "daily" | "packages";

export function SupabaseClasses() {
  const { classes, addClass, updateClass } = useSupabaseGymData();
  const [view, setView] = useState<ViewType>("calendar");

  const handleAddClass = async (classData: any) => {
    try {
      await addClass(classData);
    } catch (error) {
      console.error('Failed to add class:', error);
    }
  };

  // Persist confirm/cancel to Supabase
  const handleConfirmClass = async (id: string) => {
    try {
      await updateClass(id, { status: 'confirmada' });
    } catch (error) {
      console.error('Failed to confirm class:', error);
    }
  };

  const handleCancelClass = async (id: string) => {
    try {
      await updateClass(id, { status: 'cancelada' });
    } catch (error) {
      console.error('Failed to cancel class:', error);
    }
  };

  // Map Supabase classes to DailyClassView format
  const classItems = classes.map((c, idx) => ({
    id: idx + 1,
    student: c.nome || 'N/A',
    date: c.data_aula,
    time: c.horario_inicio,
    type: c.tipo || c.nome,
    status: (c as any).status === 'confirmada' ? 'Confirmada' : (c as any).status === 'cancelada' ? 'Cancelada' : 'Agendada',
  }));

  // Map numeric index back to real class id
  const classIdMap = classes.map(c => c.id);

  const renderContent = () => {
    switch (view) {
      case "calendar":
        return <ClassCalendar />;
      case "packages":
        return <MultiDayScheduler />;
      case "daily":
      default:
        return (
          <DailyClassView 
            classes={classItems}
            onConfirmClass={(id: number) => handleConfirmClass(classIdMap[id - 1])}
            onCancelClass={(id: number) => handleCancelClass(classIdMap[id - 1])}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Controle de Aulas
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie aulas individuais e pacotes mensais</p>
        </div>
        <div className="flex space-x-2">
          <AddClassDialog onAddClass={handleAddClass} />
          <Button variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")} className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" /><span>Calendário</span>
          </Button>
          <Button variant={view === "daily" ? "default" : "outline"} onClick={() => setView("daily")} className="flex items-center space-x-2">
            <List className="w-4 h-4" /><span>Aulas Diárias</span>
          </Button>
          <Button variant={view === "packages" ? "default" : "outline"} onClick={() => setView("packages")} className="flex items-center space-x-2">
            <Grid className="w-4 h-4" /><span>Pacotes Mensais</span>
          </Button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
