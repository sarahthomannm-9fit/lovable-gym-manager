import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Copy, Users, Search } from "lucide-react";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  category: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  duration: number; // em minutos
  exercises: Exercise[];
  usedBy: number; // quantos alunos usam
  isActive: boolean;
}

export function WorkoutTemplates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([
    {
      id: "1",
      name: "Peito e Tríceps - Iniciante",
      category: "Força",
      level: "Iniciante",
      duration: 45,
      usedBy: 8,
      isActive: true,
      exercises: [
        { name: "Supino Reto", sets: 3, reps: "12-15", rest: "60s" },
        { name: "Supino Inclinado", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Crucifixo", sets: 3, reps: "12-15", rest: "45s" },
        { name: "Tríceps Pulley", sets: 3, reps: "12-15", rest: "45s" },
        { name: "Tríceps Francês", sets: 3, reps: "10-12", rest: "45s" }
      ]
    },
    {
      id: "2",
      name: "Costas e Bíceps - Intermediário",
      category: "Força",
      level: "Intermediário",
      duration: 60,
      usedBy: 12,
      isActive: true,
      exercises: [
        { name: "Puxada Frontal", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Remada Baixa", sets: 4, reps: "8-10", rest: "90s" },
        { name: "Remada Curvada", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Rosca Direta", sets: 3, reps: "10-12", rest: "60s" },
        { name: "Rosca Martelo", sets: 3, reps: "12-15", rest: "45s" }
      ]
    },
    {
      id: "3",
      name: "HIIT Cardio",
      category: "Cardio",
      level: "Intermediário",
      duration: 30,
      usedBy: 15,
      isActive: true,
      exercises: [
        { name: "Burpees", sets: 4, reps: "30s", rest: "30s" },
        { name: "Mountain Climbers", sets: 4, reps: "30s", rest: "30s" },
        { name: "Jump Squats", sets: 4, reps: "30s", rest: "30s" },
        { name: "High Knees", sets: 4, reps: "30s", rest: "30s" },
        { name: "Prancha", sets: 3, reps: "45s", rest: "60s" }
      ]
    }
  ]);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch(level) {
      case "Iniciante": return "bg-green-100 text-green-800";
      case "Intermediário": return "bg-yellow-100 text-yellow-800";
      case "Avançado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "Força": return "bg-blue-100 text-blue-800";
      case "Cardio": return "bg-orange-100 text-orange-800";
      case "Funcional": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar modelos de treino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                  <Badge className={getLevelColor(template.level)}>
                    {template.level}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {template.usedBy} alunos
                </span>
                <span>{template.duration} min</span>
                <span>{template.exercises.length} exercícios</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Lista de Exercícios */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Exercícios:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {template.exercises.map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{exercise.name}</span>
                      <span className="text-gray-600">
                        {exercise.sets}x {exercise.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Ativo" : "Inativo"}
                </Badge>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicar
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum modelo de treino encontrado</p>
        </div>
      )}
    </div>
  );
}