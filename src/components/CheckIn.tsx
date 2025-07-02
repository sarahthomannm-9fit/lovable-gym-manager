import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Users, Activity, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CheckInRecord {
  id: string;
  studentName: string;
  studentId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number; // em minutos
  plan: string;
}

export function CheckIn() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([
    {
      id: "1",
      studentName: "João Silva",
      studentId: "001",
      checkInTime: new Date(Date.now() - 45 * 60000), // 45 min atrás
      plan: "Mensal"
    },
    {
      id: "2", 
      studentName: "Maria Santos",
      studentId: "002",
      checkInTime: new Date(Date.now() - 120 * 60000), // 2h atrás
      checkOutTime: new Date(Date.now() - 30 * 60000), // saiu 30 min atrás
      duration: 90,
      plan: "Trimestral"
    },
    {
      id: "3",
      studentName: "Carlos Oliveira", 
      studentId: "003",
      checkInTime: new Date(Date.now() - 20 * 60000), // 20 min atrás
      plan: "Anual"
    }
  ]);

  // Simular dados de alunos para busca
  const students = [
    { id: "001", name: "João Silva", plan: "Mensal", status: "active" },
    { id: "002", name: "Maria Santos", plan: "Trimestral", status: "active" },
    { id: "003", name: "Carlos Oliveira", plan: "Anual", status: "active" },
    { id: "004", name: "Ana Costa", plan: "Mensal", status: "active" },
    { id: "005", name: "Pedro Lima", plan: "Anual", status: "inactive" }
  ];

  const handleCheckIn = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      toast({
        title: "Erro",
        description: "Aluno não encontrado",
        variant: "destructive"
      });
      return;
    }

    if (student.status === "inactive") {
      toast({
        title: "Erro", 
        description: "Aluno com mensalidade em atraso",
        variant: "destructive"
      });
      return;
    }

    // Verificar se já tem check-in ativo
    const activeCheckIn = checkInRecords.find(
      record => record.studentId === studentId && !record.checkOutTime
    );

    if (activeCheckIn) {
      toast({
        title: "Erro",
        description: "Aluno já está na academia",
        variant: "destructive"
      });
      return;
    }

    const newCheckIn: CheckInRecord = {
      id: Date.now().toString(),
      studentName: student.name,
      studentId: studentId,
      checkInTime: new Date(),
      plan: student.plan
    };

    setCheckInRecords(prev => [newCheckIn, ...prev]);
    setSearchQuery("");
    
    toast({
      title: "Check-in realizado",
      description: `${student.name} entrou na academia`,
    });
  };

  const handleCheckOut = (recordId: string) => {
    setCheckInRecords(prev => prev.map(record => {
      if (record.id === recordId && !record.checkOutTime) {
        const duration = Math.floor((Date.now() - record.checkInTime.getTime()) / 60000);
        return {
          ...record,
          checkOutTime: new Date(),
          duration
        };
      }
      return record;
    }));

    const record = checkInRecords.find(r => r.id === recordId);
    if (record) {
      toast({
        title: "Check-out realizado",
        description: `${record.studentName} saiu da academia`,
      });
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id.includes(searchQuery)
  );

  const activeStudents = checkInRecords.filter(record => !record.checkOutTime).length;
  const todayCheckIns = checkInRecords.filter(record => 
    record.checkInTime.toDateString() === new Date().toDateString()
  ).length;

  const averageTime = checkInRecords
    .filter(record => record.duration)
    .reduce((sum, record) => sum + (record.duration || 0), 0) / 
    checkInRecords.filter(record => record.duration).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Check-in / Check-out
        </h1>
        <p className="text-gray-600 mt-1">Controle de acesso à academia</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Na Academia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{activeStudents}</div>
            <p className="text-xs text-green-600 mt-1">Alunos ativos agora</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Check-ins Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{todayCheckIns}</div>
            <p className="text-xs text-blue-600 mt-1">Total do dia</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{Math.round(averageTime)}min</div>
            <p className="text-xs text-purple-600 mt-1">Permanência média</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Pico Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">18:30</div>
            <p className="text-xs text-orange-600 mt-1">Horário de pico</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Fazer Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Buscar por nome ou ID do aluno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchQuery && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-600">
                          ID: {student.id} • {student.plan}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={student.status === "active" ? "default" : "destructive"}>
                          {student.status === "active" ? "Ativo" : "Inadimplente"}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(student.id)}
                          disabled={student.status === "inactive"}
                        >
                          Check-in
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum aluno encontrado</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alunos na Academia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Alunos na Academia ({activeStudents})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {checkInRecords.filter(record => !record.checkOutTime).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{record.studentName}</div>
                    <div className="text-sm text-gray-600">
                      Entrada: {record.checkInTime.toLocaleTimeString()} • {record.plan}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.floor((Date.now() - record.checkInTime.getTime()) / 60000)} min na academia
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCheckOut(record.id)}
                  >
                    Check-out
                  </Button>
                </div>
              ))}
              {activeStudents === 0 && (
                <p className="text-gray-500 text-center py-8">Nenhum aluno na academia</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico Recente */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checkInRecords.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{record.studentName}</div>
                  <div className="text-sm text-gray-600">
                    {record.checkInTime.toLocaleString()} 
                    {record.checkOutTime && ` - ${record.checkOutTime.toLocaleString()}`}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={record.checkOutTime ? "secondary" : "default"}>
                    {record.checkOutTime ? "Concluído" : "Ativo"}
                  </Badge>
                  {record.duration && (
                    <div className="text-sm text-gray-600 mt-1">
                      {record.duration} min
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}