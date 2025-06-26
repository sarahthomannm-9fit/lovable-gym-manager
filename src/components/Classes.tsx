
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Plus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Classes() {
  const [classes, setClasses] = useState([
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

  const [newClass, setNewClass] = useState({
    student: "",
    date: "",
    time: "",
    type: ""
  });

  const { toast } = useToast();

  const handleAddClass = () => {
    if (!newClass.student || !newClass.date || !newClass.time || !newClass.type) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const classItem = {
      id: classes.length + 1,
      ...newClass,
      status: "Agendada"
    };

    setClasses([...classes, classItem]);
    setNewClass({
      student: "",
      date: "",
      time: "",
      type: ""
    });

    toast({
      title: "Sucesso",
      description: "Aula agendada com sucesso!",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmada":
        return "bg-green-100 text-green-800";
      case "Agendada":
        return "bg-blue-100 text-blue-800";
      case "Cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupedClasses = classes.reduce((acc, classItem) => {
    const date = classItem.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(classItem);
    return acc;
  }, {} as Record<string, typeof classes>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Aulas Agendadas
          </h1>
          <p className="text-gray-600 mt-1">Gerencie seus agendamentos</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agendar Nova Aula</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student">Aluno</Label>
                <Select value={newClass.student} onValueChange={(value) => setNewClass({...newClass, student: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="João Silva">João Silva</SelectItem>
                    <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                    <SelectItem value="Pedro Costa">Pedro Costa</SelectItem>
                    <SelectItem value="Ana Paula">Ana Paula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={newClass.date}
                  onChange={(e) => setNewClass({...newClass, date: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={newClass.time}
                  onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo de Treino</Label>
                <Select value={newClass.type} onValueChange={(value) => setNewClass({...newClass, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Musculação">Musculação</SelectItem>
                    <SelectItem value="Funcional">Funcional</SelectItem>
                    <SelectItem value="HIIT">HIIT</SelectItem>
                    <SelectItem value="Cardio">Cardio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleAddClass} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Agendar Aula
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedClasses)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([date, dayClasses]) => (
            <div key={date}>
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dayClasses
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((classItem) => (
                    <Card key={classItem.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-blue-600" />
                            {classItem.time}
                          </CardTitle>
                          <Badge className={getStatusColor(classItem.status)}>
                            {classItem.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{classItem.student}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <strong>Tipo:</strong> {classItem.type}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2 mt-4">
                          {classItem.status === "Agendada" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              Confirmar
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
