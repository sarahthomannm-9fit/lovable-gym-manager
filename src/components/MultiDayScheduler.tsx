
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Plus, Clock, DollarSign, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduleBlock {
  id: number;
  student: string;
  startDate: string;
  endDate: string;
  days: string[];
  time: string;
  type: string;
  totalClasses: number;
  totalValue: number;
  status: "Agendado" | "Confirmado" | "Pago";
}

export function MultiDayScheduler() {
  const [schedules, setSchedules] = useState<ScheduleBlock[]>([
    {
      id: 1,
      student: "João Silva",
      startDate: "2024-06-01",
      endDate: "2024-06-30",
      days: ["Segunda", "Quarta", "Sexta"],
      time: "09:00",
      type: "Musculação",
      totalClasses: 13,
      totalValue: 650,
      status: "Confirmado"
    }
  ]);

  const [newSchedule, setNewSchedule] = useState({
    student: "",
    startDate: "",
    endDate: "",
    days: [] as string[],
    time: "",
    type: "",
    pricePerClass: 50
  });

  const { toast } = useToast();

  const weekDays = [
    "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
  ];

  const handleDayToggle = (day: string) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const calculateTotalClasses = () => {
    if (!newSchedule.startDate || !newSchedule.endDate || newSchedule.days.length === 0) {
      return 0;
    }
    
    const start = new Date(newSchedule.startDate);
    const end = new Date(newSchedule.endDate);
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const weeksCount = Math.ceil(dayCount / 7);
    
    return weeksCount * newSchedule.days.length;
  };

  const handleCreateSchedule = () => {
    if (!newSchedule.student || !newSchedule.startDate || !newSchedule.endDate || 
        newSchedule.days.length === 0 || !newSchedule.time || !newSchedule.type) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const totalClasses = calculateTotalClasses();
    const totalValue = totalClasses * newSchedule.pricePerClass;

    const schedule: ScheduleBlock = {
      id: schedules.length + 1,
      student: newSchedule.student,
      startDate: newSchedule.startDate,
      endDate: newSchedule.endDate,
      days: newSchedule.days,
      time: newSchedule.time,
      type: newSchedule.type,
      totalClasses,
      totalValue,
      status: "Agendado"
    };

    setSchedules([...schedules, schedule]);
    setNewSchedule({
      student: "",
      startDate: "",
      endDate: "",
      days: [],
      time: "",
      type: "",
      pricePerClass: 50
    });

    toast({
      title: "Sucesso",
      description: `Agendamento criado: ${totalClasses} aulas por R$ ${totalValue}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmado":
        return "bg-green-100 text-green-800";
      case "Agendado":
        return "bg-blue-100 text-blue-800";
      case "Pago":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Agendamento Multi-Dias
          </h1>
          <p className="text-gray-600 mt-1">Crie pacotes mensais de aulas facilmente</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pacote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Pacote de Aulas</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student">Aluno *</Label>
                  <Select value={newSchedule.student} onValueChange={(value) => setNewSchedule({...newSchedule, student: value})}>
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
                  <Label htmlFor="type">Tipo de Treino *</Label>
                  <Select value={newSchedule.type} onValueChange={(value) => setNewSchedule({...newSchedule, type: value})}>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newSchedule.startDate}
                    onChange={(e) => setNewSchedule({...newSchedule, startDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Data Fim *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newSchedule.endDate}
                    onChange={(e) => setNewSchedule({...newSchedule, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Preço por Aula</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newSchedule.pricePerClass}
                    onChange={(e) => setNewSchedule({...newSchedule, pricePerClass: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label>Dias da Semana *</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {weekDays.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={newSchedule.days.includes(day)}
                        onCheckedChange={() => handleDayToggle(day)}
                      />
                      <Label htmlFor={day} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {newSchedule.startDate && newSchedule.endDate && newSchedule.days.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Resumo do Pacote</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Total de Aulas:</strong> {calculateTotalClasses()}</p>
                    <p><strong>Valor Total:</strong> R$ {(calculateTotalClasses() * newSchedule.pricePerClass).toFixed(2)}</p>
                    <p><strong>Dias:</strong> {newSchedule.days.join(", ")}</p>
                  </div>
                </div>
              )}
              
              <Button onClick={handleCreateSchedule} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Criar Pacote de Aulas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{schedule.student}</CardTitle>
                <Badge className={getStatusColor(schedule.status)}>
                  {schedule.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">
                    {new Date(schedule.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
                    {new Date(schedule.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{schedule.time} - {schedule.type}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <strong>Dias:</strong> {schedule.days.join(", ")}
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Total de Aulas:</span>
                    <span className="font-bold">{schedule.totalClasses}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Valor Total:
                    </span>
                    <span className="font-bold text-green-600">R$ {schedule.totalValue}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  {schedule.status === "Agendado" && (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Confirmar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
