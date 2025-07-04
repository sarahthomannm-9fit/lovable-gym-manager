
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Users, Activity, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGymData } from "@/contexts/GymDataContext";

export function CheckIn() {
  const { students, checkIns, addCheckIn } = useGymData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleCheckIn = (studentId: number) => {
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
    const activeCheckIn = checkIns.find(
      record => record.studentId === studentId && record.type === 'entry' && 
      !checkIns.some(exit => exit.studentId === studentId && exit.type === 'exit' && exit.date >= record.date)
    );

    if (activeCheckIn) {
      toast({
        title: "Erro",
        description: "Aluno já está na academia",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    addCheckIn({
      studentId: studentId,
      studentName: student.name,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      type: 'entry'
    });

    setSearchQuery("");
    
    toast({
      title: "Check-in realizado",
      description: `${student.name} entrou na academia`,
    });
  };

  const handleCheckOut = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const now = new Date();
    addCheckIn({
      studentId: studentId,
      studentName: student.name,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      type: 'exit'
    });

    toast({
      title: "Check-out realizado",
      description: `${student.name} saiu da academia`,
    });
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id.toString().includes(searchQuery)
  );

  // Calculate active students (those who checked in but haven't checked out)
  const activeStudents = students.filter(student => {
    const lastEntry = checkIns
      .filter(c => c.studentId === student.id && c.type === 'entry')
      .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime())[0];
    
    if (!lastEntry) return false;
    
    const lastExit = checkIns
      .filter(c => c.studentId === student.id && c.type === 'exit')
      .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime())[0];
    
    if (!lastExit) return true;
    
    return new Date(`${lastEntry.date} ${lastEntry.time}`) > new Date(`${lastExit.date} ${lastExit.time}`);
  });

  const todayCheckIns = checkIns.filter(record => 
    record.date === new Date().toISOString().split('T')[0] && record.type === 'entry'
  ).length;

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
            <div className="text-2xl font-bold text-green-800">{activeStudents.length}</div>
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
              Total Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{checkIns.filter(c => c.type === 'entry').length}</div>
            <p className="text-xs text-purple-600 mt-1">Histórico total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Alunos Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{students.length}</div>
            <p className="text-xs text-orange-600 mt-1">Total de alunos</p>
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
                          {student.status === "active" ? "Ativo" : student.status === "inactive" ? "Inadimplente" : "Suspenso"}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(student.id)}
                          disabled={student.status !== "active"}
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
              Alunos na Academia ({activeStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {activeStudents.map((student) => {
                const lastEntry = checkIns
                  .filter(c => c.studentId === student.id && c.type === 'entry')
                  .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime())[0];
                
                const entryTime = lastEntry ? new Date(`${lastEntry.date} ${lastEntry.time}`) : new Date();
                const minutesInGym = Math.floor((Date.now() - entryTime.getTime()) / 60000);
                
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-600">
                        Entrada: {lastEntry?.time} • {student.plan}
                      </div>
                      <div className="text-xs text-gray-500">
                        {minutesInGym} min na academia
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCheckOut(student.id)}
                    >
                      Check-out
                    </Button>
                  </div>
                );
              })}
              {activeStudents.length === 0 && (
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
            {checkIns
              .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime())
              .slice(0, 10)
              .map((record, index) => (
                <div
                  key={`${record.id}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{record.studentName}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(`${record.date} ${record.time}`).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={record.type === 'entry' ? "default" : "secondary"}>
                      {record.type === 'entry' ? "Entrada" : "Saída"}
                    </Badge>
                  </div>
                </div>
              ))}
            {checkIns.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum check-in registrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
