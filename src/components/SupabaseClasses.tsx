
import { useState } from "react";
import { MultiDayScheduler } from "./MultiDayScheduler";
import { DailyClassView } from "./DailyClassView";
import { ClassCalendar } from "./ClassCalendar";
import { AddClassDialog } from "./AddClassDialog";
import { Button } from "@/components/ui/button";
import { Grid, List, Calendar } from "lucide-react";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";

type ViewType = "calendar" | "daily" | "packages";

interface ClassItem {
  id: number;
  student: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

export function SupabaseClasses() {
  const { classes, addClass, students } = useSupabaseGymData();
  const [view, setView] = useState<ViewType>("calendar");

  // Convert Supabase classes to local format
  const [localClasses, setLocalClasses] = useState<ClassItem[]>([]);

  const handleAddClass = async (classData: any) => {
    try {
      await addClass(classData);

      // Add to local state for immediate UI update (convert to old format)
      const classItem: ClassItem = {
        id: Date.now(),
        student: "N/A", // Since we don't have individual student assignments
        date: classData.data_aula,
        time: classData.horario_inicio,
        type: classData.tipo || classData.nome,
        status: "Agendada"
      };

      setLocalClasses([...localClasses, classItem]);
    } catch (error) {
      console.error('Failed to add class:', error);
    }
  };

  const handleConfirmClass = (id: number) => {
    setLocalClasses(localClasses.map(c => 
      c.id === id ? { ...c, status: "Confirmada" } : c
    ));
  };

  const handleCancelClass = (id: number) => {
    setLocalClasses(localClasses.map(c => 
      c.id === id ? { ...c, status: "Cancelada" } : c
    ));
  };

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
            classes={localClasses}
            onConfirmClass={handleConfirmClass}
            onCancelClass={handleCancelClass}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Controle de Aulas (Supabase)
          </h1>
          <p className="text-gray-600 mt-1">Gerencie aulas individuais e pacotes mensais conectados ao banco de dados</p>
        </div>
        
        <div className="flex space-x-2">
          <AddClassDialog onAddClass={handleAddClass} />
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            onClick={() => setView("calendar")}
            className="flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Calendário</span>
          </Button>
          <Button
            variant={view === "daily" ? "default" : "outline"}
            onClick={() => setView("daily")}
            className="flex items-center space-x-2"
          >
            <List className="w-4 h-4" />
            <span>Aulas Diárias</span>
          </Button>
          <Button
            variant={view === "packages" ? "default" : "outline"}
            onClick={() => setView("packages")}
            className="flex items-center space-x-2"
          >
            <Grid className="w-4 h-4" />
            <span>Pacotes Mensais</span>
          </Button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
