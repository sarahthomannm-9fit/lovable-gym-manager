
import { useState } from "react";
import { MultiDayScheduler } from "./MultiDayScheduler";
import { DailyClassView } from "./DailyClassView";
import { AddClassDialog } from "./AddClassDialog";
import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";
import { useGymData } from "@/contexts/GymDataContext";

type ViewType = "daily" | "packages";

interface ClassItem {
  id: number;
  student: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

interface NewClass {
  student: string;
  date: string;
  time: string;
  type: string;
}

export function Classes() {
  const { classes, addClass, students, metrics } = useGymData();
  const [view, setView] = useState<ViewType>("daily");

  // Convert context classes to local format
  const [localClasses, setLocalClasses] = useState<ClassItem[]>([]);

  const handleAddClass = (newClass: NewClass) => {
    // Add to context
    addClass({
      name: `${newClass.type} - ${newClass.student}`,
      instructor: "Instrutor",
      date: newClass.date,
      time: newClass.time,
      capacity: 1,
      enrolled: 1,
      type: newClass.type
    });

    // Add to local state for immediate UI update
    const classItem: ClassItem = {
      id: Date.now(),
      ...newClass,
      status: "Agendada"
    };

    setLocalClasses([...localClasses, classItem]);
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
            Controle de Aulas
          </h1>
          <p className="text-gray-600 mt-1">Gerencie aulas individuais e pacotes mensais</p>
        </div>
        
        <div className="flex space-x-2">
          <AddClassDialog onAddClass={handleAddClass} />
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
