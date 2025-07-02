import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, Calendar, TrendingUp, Award } from "lucide-react";

interface StudentWorkout {
  id: string;
  studentName: string;
  studentId: string;
  workoutName: string;
  assignedDate: Date;
  lastCompleted?: Date;
  completionRate: number; // porcentagem
  totalSessions: number;
  completedSessions: number;
  currentWeek: number;
  totalWeeks: number;
  status: "active" | "paused" | "completed";
}

export function StudentWorkouts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [studentWorkouts, setStudentWorkouts] = useState<StudentWorkout[]>([
    {
      id: "1",
      studentName: "João Silva",
      studentId: "001",
      workoutName: "Peito e Tríceps - Iniciante",
      assignedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completionRate: 85,
      totalSessions: 12,
      completedSessions: 10,
      currentWeek: 3,
      totalWeeks: 4,
      status: "active"
    },
    {
      id: "2",
      studentName: "Maria Santos",
      studentId: "002", 
      workoutName: "HIIT Cardio",
      assignedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      lastCompleted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completionRate: 95,
      totalSessions: 18,
      completedSessions: 17,
      currentWeek: 4,
      totalWeeks: 6,
      status: "active"
    },
    {
      id: "3",
      studentName: "Carlos Oliveira",
      studentId: "003",
      workoutName: "Costas e Bíceps - Intermediário",
      assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastCompleted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completionRate: 60,
      totalSessions: 10,
      completedSessions: 6,
      currentWeek: 1,
      totalWeeks: 8,
      status: "active"
    }
  ]);

  const filteredWorkouts = studentWorkouts.filter(workout =>
    workout.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.workoutName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.studentId.includes(searchQuery)
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por aluno ou treino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Treinos dos Alunos */}
      <div className="space-y-4">
        {filteredWorkouts.map((workout) => (
          <Card key={workout.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{workout.studentName}</CardTitle>
                  <p className="text-sm text-gray-600">ID: {workout.studentId}</p>
                </div>
                <Badge className={getStatusColor(workout.status)}>
                  {workout.status === "active" ? "Ativo" : 
                   workout.status === "paused" ? "Pausado" : "Concluído"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informações do Treino */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Treino Atual:</h4>
                    <p className="text-sm text-gray-600">{workout.workoutName}</p>
                  </div>

                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      Iniciado em {workout.assignedDate.toLocaleDateString()}
                    </div>
                    {workout.lastCompleted && (
                      <div className="flex items-center text-gray-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Último: {workout.lastCompleted.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progresso */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Taxa de Conclusão</span>
                      <span className={`text-sm font-bold ${getCompletionColor(workout.completionRate)}`}>
                        {workout.completionRate}%
                      </span>
                    </div>
                    <Progress value={workout.completionRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Sessões:</span>
                      <span className="font-medium ml-1">
                        {workout.completedSessions}/{workout.totalSessions}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Semana:</span>
                      <span className="font-medium ml-1">
                        {workout.currentWeek}/{workout.totalWeeks}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2">
                  {workout.completionRate >= 80 && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Award className="w-3 h-3 mr-1" />
                      Excelente
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    Alterar Treino
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={workout.status === "active" ? "text-yellow-600" : "text-green-600"}
                  >
                    {workout.status === "active" ? "Pausar" : "Reativar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkouts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum treino encontrado</p>
        </div>
      )}
    </div>
  );
}