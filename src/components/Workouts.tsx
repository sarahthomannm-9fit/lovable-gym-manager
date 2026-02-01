import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, Users, Target, Calendar } from "lucide-react";
import { WorkoutTemplates } from "./workouts/WorkoutTemplates";
import { StudentWorkouts } from "./workouts/StudentWorkouts";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";

export function Workouts() {
  const { students, studentsLoading } = useSupabaseGymData();
  const [activeTab, setActiveTab] = useState("templates");

  const activeStudents = students.filter(s => s.status === 'ativo').length;

  const workoutStats = {
    totalTemplates: 0, // Templates now managed in WorkoutTemplates component
    activeWorkouts: activeStudents,
    completedThisWeek: 0,
    averageCompletion: students.length > 0 ? Math.round((activeStudents / students.length) * 100) : 0
  };

  const tabs = [
    { id: "templates", name: "Modelos de Treino", icon: Target },
    { id: "students", name: "Treinos dos Alunos", icon: Users }
  ];

  if (studentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Sistema de Treinos
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie treinos e acompanhe o progresso</p>
        </div>
        
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Treino
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Modelos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">{workoutStats.totalTemplates}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Modelos criados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Alunos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{workoutStats.activeWorkouts}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Com treinos ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center">
              <Dumbbell className="w-4 h-4 mr-2" />
              Total de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">{students.length}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Alunos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Taxa de Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{workoutStats.averageCompletion}%</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Alunos ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Navegação por abas */}
      <div className="flex space-x-1 border-b">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center space-x-2"
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </Button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      {activeTab === "templates" && <WorkoutTemplates />}
      {activeTab === "students" && <StudentWorkouts />}
    </div>
  );
}