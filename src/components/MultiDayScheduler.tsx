
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Plus, Clock, DollarSign, CheckCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { PackageTypeSelector } from "./PackageTypeSelector";
import { StudentClassReport } from "./StudentClassReport";
import { PaymentReminder } from "./PaymentReminder";

interface ScheduleBlock {
  id: number;
  studentId: string;
  student: string;
  studentPhone: string;
  studentEmail: string;
  startDate: string;
  endDate: string;
  days: string[];
  time: string;
  type: string;
  totalClasses: number;
  totalValue: number;
  status: "Agendado" | "Confirmado" | "Pago";
  clientType: 'recorrente' | 'variavel';
  includedInBilling: boolean;
}

export function MultiDayScheduler() {
  const { students } = useSupabaseGymData();
  const [schedules, setSchedules] = useState<ScheduleBlock[]>([
    {
      id: 1,
      studentId: "1",
      student: "João Silva",
      studentPhone: "(11) 99999-9999",
      studentEmail: "joao@email.com",
      startDate: "2024-06-01",
      endDate: "2024-06-30",
      days: ["Segunda", "Quarta", "Sexta"],
      time: "09:00",
      type: "Musculação",
      totalClasses: 13,
      totalValue: 650,
      status: "Confirmado",
      clientType: "recorrente",
      includedInBilling: true
    }
  ]);

  const [newSchedule, setNewSchedule] = useState({
    studentId: "",
    student: "",
    startDate: "",
    endDate: "",
    days: [] as string[],
    time: "",
    type: "",
    pricePerClass: 50,
    clientType: 'recorrente' as 'recorrente' | 'variavel'
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

    const selectedStudent = students.find(s => s.nome === newSchedule.student);
    if (!selectedStudent) {
      toast({
        title: "Erro",
        description: "Aluno não encontrado",
        variant: "destructive",
      });
      return;
    }

    const totalClasses = calculateTotalClasses();
    const totalValue = totalClasses * newSchedule.pricePerClass;

    const schedule: ScheduleBlock = {
      id: schedules.length + 1,
      studentId: selectedStudent.id,
      student: newSchedule.student,
      studentPhone: selectedStudent.telefone || "",
      studentEmail: selectedStudent.email || "",
      startDate: newSchedule.startDate,
      endDate: newSchedule.endDate,
      days: newSchedule.days,
      time: newSchedule.time,
      type: newSchedule.type,
      totalClasses,
      totalValue,
      status: "Agendado",
      clientType: newSchedule.clientType,
      includedInBilling: newSchedule.clientType === 'recorrente'
    };

    setSchedules([...schedules, schedule]);
    setNewSchedule({
      studentId: "",
      student: "",
      startDate: "",
      endDate: "",
      days: [],
      time: "",
      type: "",
      pricePerClass: 50,
      clientType: 'recorrente'
    });

    toast({
      title: "Sucesso",
      description: `Agendamento criado: ${totalClasses} aulas por R$ ${totalValue}`,
    });
  };

  const handleStudentChange = (studentName: string) => {
    const selectedStudent = students.find(s => s.nome === studentName);
    setNewSchedule(prev => ({
      ...prev,
      student: studentName,
      studentId: selectedStudent?.id || ""
    }));
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

  const getClientTypeColor = (type: string) => {
    return type === 'recorrente' ? 
      "bg-green-100 text-green-800" : 
      "bg-orange-100 text-orange-800";
  };

  const handlePackageDetails = (schedule: ScheduleBlock) => {
    toast({
      title: "Detalhes do Pacote",
      description: `Pacote de ${schedule.totalClasses} aulas para ${schedule.student}`,
    });
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
                  <Select value={newSchedule.student} onValueChange={handleStudentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.nome}>
                          {student.nome}
                        </SelectItem>
                      ))}
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

              <PackageTypeSelector 
                selectedType={newSchedule.clientType}
                onTypeChange={(type) => setNewSchedule({...newSchedule, clientType: type})}
              />

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
                    <p><strong>Tipo de Cliente:</strong> {newSchedule.clientType === 'recorrente' ? 'Recorrente' : 'Variável'}</p>
                    <p><strong>Faturamento:</strong> {newSchedule.clientType === 'recorrente' ? 'Imediato' : 'Após confirmação'}</p>
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
                <div className="flex flex-col space-y-1">
                  <Badge className={getStatusColor(schedule.status)}>
                    {schedule.status}
                  </Badge>
                  <Badge className={getClientTypeColor(schedule.clientType)}>
                    {schedule.clientType === 'recorrente' ? 'Recorrente' : 'Variável'}
                  </Badge>
                </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Valor Total:
                    </span>
                    <span className="font-bold text-green-600">R$ {schedule.totalValue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">No faturamento:</span>
                    <span className={`text-xs font-medium ${schedule.includedInBilling ? 'text-green-600' : 'text-orange-600'}`}>
                      {schedule.includedInBilling ? 'Sim' : 'Aguardando confirmação'}
                    </span>
                  </div>
                </div>

                <PaymentReminder 
                  studentId={schedule.studentId}
                  studentName={schedule.student}
                  studentPhone={schedule.studentPhone}
                  studentEmail={schedule.studentEmail}
                  planExpirationDate={schedule.endDate}
                  planValue={schedule.totalValue}
                />
                
                <div className="flex space-x-2 mt-4">
                  {schedule.status === "Agendado" && (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Confirmar
                    </Button>
                  )}
                  
                  <StudentClassReport 
                    studentId={schedule.studentId}
                    studentName={schedule.student}
                    packageData={schedule}
                  />
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => handlePackageDetails(schedule)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
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
