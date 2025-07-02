import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell, Users, Target, Calendar } from "lucide-react";
import { WorkoutTemplates } from "./workouts/WorkoutTemplates";
import { StudentWorkouts } from "./workouts/StudentWorkouts";

export function Workouts() {
  const [activeTab, setActiveTab] = useState("templates");

  const workoutStats = {
    totalTemplates: 15,
    activeWorkouts: 42,
    completedThisWeek: 156,
    averageCompletion: 87
  };

  const tabs = [
    { id: "templates", name: "Modelos de Treino", icon: Target },
    { id: "students", name: "Treinos dos Alunos", icon: Users }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Sistema de Treinos
          </h1>
          <p className="text-gray-600 mt-1">Gerencie treinos e acompanhe o progresso</p>
        </div>
        
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Treino
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Modelos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{workoutStats.totalTemplates}</div>
            <p className="text-xs text-orange-600 mt-1">Modelos criados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Treinos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{workoutStats.activeWorkouts}</div>
            <p className="text-xs text-blue-600 mt-1">Alunos com treino</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <Dumbbell className="w-4 h-4 mr-2" />
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{workoutStats.completedThisWeek}</div>
            <p className="text-xs text-green-600 mt-1">Treinos realizados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Taxa de Adesão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{workoutStats.averageCompletion}%</div>
            <p className="text-xs text-purple-600 mt-1">Média de conclusão</p>
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