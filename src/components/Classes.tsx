
import { useState } from "react";
import { MultiDayScheduler } from "./MultiDayScheduler";
import { DailyClassView } from "./DailyClassView";
import { AddClassDialog } from "./AddClassDialog";
import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";

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
  const [view, setView] = useState<ViewType>("daily");

  const [classes, setClasses] = useState<ClassItem[]>([
    {
      id: 1,
      student: "João Silva",
      date: "2024-01-15",
      time: "09:00",
      type: "Musculação",
      status: "Confirmada"
    },
    {
      id: 2,
      student: "Maria Santos",
      date: "2024-01-15",
      time: "10:30",
      type: "Funcional",
      status: "Agendada"
    },
    {
      id: 3,
      student: "Pedro Costa",
      date: "2024-01-15",
      time: "14:00",
      type: "HIIT",
      status: "Cancelada"
    },
    {
      id: 4,
      student: "Ana Paula",
      date: "2024-01-16",
      time: "08:00",
      type: "Musculação",
      status: "Agendada"
    }
  ]);

  const handleAddClass = (newClass: NewClass) => {
    const classItem: ClassItem = {
      id: classes.length + 1,
      ...newClass,
      status: "Agendada"
    };

    setClasses([...classes, classItem]);
  };

  const handleConfirmClass = (id: number) => {
    setClasses(classes.map(c => 
      c.id === id ? { ...c, status: "Confirmada" } : c
    ));
  };

  const handleCancelClass = (id: number) => {
    setClasses(classes.map(c => 
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
            classes={classes}
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
