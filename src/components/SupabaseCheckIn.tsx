import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, Users, Activity, Calendar, QrCode, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { QRCodeCheckIn } from "./checkin/QRCodeCheckIn";

export function SupabaseCheckIn() {
  const { students, checkIns, addCheckIn, updateCheckIn } = useSupabaseGymData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("qrcode");

  const handleCheckIn = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      toast({
        title: "Erro",
        description: "Aluno não encontrado",
        variant: "destructive"
      });
      return;
    }

    if (student.status !== "ativo") {
      toast({
        title: "Erro", 
        description: "Aluno com mensalidade em atraso",
        variant: "destructive"
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const activeCheckIn = checkIns.find(
      record => record.aluno_id === studentId && 
      (record.data_checkin === today || record.horario_entrada?.startsWith(today)) &&
      !record.horario_saida
    );

    if (activeCheckIn) {
      toast({
        title: "Erro",
        description: "Aluno já está na academia",
        variant: "destructive"
      });
      return;
    }

    try {
      await addCheckIn({
        aluno_id: studentId,
        data_checkin: today,
        horario_entrada: new Date().toISOString()
      });

      setSearchQuery("");
      
      toast({
        title: "Check-in realizado",
        description: `${student.nome} entrou na academia`,
      });
    } catch (error) {
      console.error('Failed to add check-in:', error);
    }
  };

  const handleCheckOut = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const today = new Date().toISOString().split('T')[0];
    const activeCheckIn = checkIns.find(
      record => record.aluno_id === studentId && 
      (record.data_checkin === today || record.horario_entrada?.startsWith(today)) &&
      !record.horario_saida
    );

    if (!activeCheckIn) {
      toast({
        title: "Erro",
        description: "Check-in ativo não encontrado",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateCheckIn(activeCheckIn.id, {
        horario_saida: new Date().toISOString()
      });

      toast({
        title: "Check-out realizado",
        description: `${student.nome} saiu da academia`,
      });
    } catch (error) {
      console.error('Failed to update check-in:', error);
    }
  };

  const filteredStudents = students.filter(student =>
    student.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id.toString().includes(searchQuery)
  );

  const today = new Date().toISOString().split('T')[0];
  const activeStudents = students.filter(student => {
    return checkIns.some(
      record => record.aluno_id === student.id && 
      (record.data_checkin === today || record.horario_entrada?.startsWith(today)) &&
      !record.horario_saida
    );
  });

  const todayCheckIns = checkIns.filter(record => 
    record.data_checkin === today || (record.horario_entrada && record.horario_entrada.startsWith(today))
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Check-in / Check-out
        </h1>
        <p className="text-muted-foreground mt-1">Controle de acesso com QR Code e biometria</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Na Academia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-300">{activeStudents.length}</div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">Alunos ativos agora</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Check-ins Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{todayCheckIns}</div>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Total do dia</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Total Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">{checkIns.length}</div>
            <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">Histórico total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Alunos Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">{students.length}</div>
            <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">Total de alunos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes modos de check-in */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="qrcode" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            QR Code
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qrcode" className="mt-6">
          <QRCodeCheckIn />
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Check-in Manual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Fazer Check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Buscar por nome ou ID do aluno..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchQuery && (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div>
                            <div className="font-medium">{student.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              {student.email}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={student.status === "ativo" ? "default" : "destructive"}>
                              {student.status === "ativo" ? "Ativo" : student.status}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(student.id)}
                              disabled={student.status !== "ativo"}
                            >
                              Check-in
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Nenhum aluno encontrado</p>
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
                      .filter(c => c.aluno_id === student.id && c.horario_entrada && !c.horario_saida)
                      .sort((a, b) => new Date(b.horario_entrada!).getTime() - new Date(a.horario_entrada!).getTime())[0];
                    
                    const entryTime = lastEntry?.horario_entrada ? new Date(lastEntry.horario_entrada) : new Date();
                    const minutesInGym = Math.floor((Date.now() - entryTime.getTime()) / 60000);
                    
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{student.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            Entrada: {entryTime.toTimeString().split(' ')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground">
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
                    <p className="text-muted-foreground text-center py-8">Nenhum aluno na academia</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Histórico Recente */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Histórico Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checkIns
                  .sort((a, b) => {
                    const dateA = new Date(a.horario_entrada || a.created_at || '').getTime();
                    const dateB = new Date(b.horario_entrada || b.created_at || '').getTime();
                    return dateB - dateA;
                  })
                  .slice(0, 10)
                  .map((record) => {
                    const student = students.find(s => s.id === record.aluno_id);
                    const entryTime = record.horario_entrada ? new Date(record.horario_entrada) : null;
                    const exitTime = record.horario_saida ? new Date(record.horario_saida) : null;
                    
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{student?.nome || 'Aluno não encontrado'}</div>
                          <div className="text-sm text-muted-foreground">
                            {entryTime ? entryTime.toLocaleString('pt-BR') : 'Horário não registrado'}
                          </div>
                          {exitTime && (
                            <div className="text-xs text-muted-foreground">
                              Saída: {exitTime.toLocaleString('pt-BR')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={exitTime ? "secondary" : "default"}>
                            {exitTime ? "Saída" : "Entrada"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                {checkIns.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Nenhum check-in registrado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
