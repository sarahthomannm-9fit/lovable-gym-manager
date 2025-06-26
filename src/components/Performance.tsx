
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Weight, Ruler, Target, Award, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface PerformanceRecord {
  id: number;
  student: string;
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  measurements: string;
  loads: string;
  goals?: string;
  notes?: string;
}

interface StudentComparison {
  student: string;
  weightProgress: number;
  bodyFatProgress: number;
  muscleMassProgress: number;
  goalAchievement: number;
}

export function Performance() {
  const [records, setRecords] = useState<PerformanceRecord[]>([
    {
      id: 1,
      student: "João Silva",
      date: "2024-01-15",
      weight: 78.5,
      bodyFat: 15.2,
      muscleMass: 45.8,
      measurements: "Braço: 38cm, Cintura: 85cm, Coxa: 56cm",
      loads: "Supino: 80kg, Agachamento: 120kg, Levantamento: 100kg",
      goals: "Reduzir 2% de gordura corporal"
    },
    {
      id: 2,
      student: "João Silva",
      date: "2024-01-01",
      weight: 80.2,
      bodyFat: 17.5,
      muscleMass: 44.1,
      measurements: "Braço: 37cm, Cintura: 88cm, Coxa: 55cm",
      loads: "Supino: 75kg, Agachamento: 110kg, Levantamento: 95kg"
    },
    {
      id: 3,
      student: "Maria Santos",
      date: "2024-01-10", 
      weight: 62.0,
      bodyFat: 22.5,
      muscleMass: 28.2,
      measurements: "Braço: 28cm, Cintura: 68cm, Coxa: 48cm",
      loads: "Supino: 40kg, Agachamento: 60kg, Levantamento: 50kg",
      goals: "Ganhar 3kg de massa muscular"
    },
    {
      id: 4,
      student: "Maria Santos",
      date: "2023-12-20",
      weight: 60.5,
      bodyFat: 24.1,
      muscleMass: 26.8,
      measurements: "Braço: 27cm, Cintura: 70cm, Coxa: 47cm",
      loads: "Supino: 35kg, Agachamento: 55kg, Levantamento: 45kg"
    },
    {
      id: 5,
      student: "Pedro Costa",
      date: "2024-01-08",
      weight: 85.2,
      bodyFat: 18.7,
      muscleMass: 52.1,
      measurements: "Braço: 42cm, Cintura: 92cm, Coxa: 62cm",
      loads: "Supino: 95kg, Agachamento: 140kg, Levantamento: 120kg",
      goals: "Aumentar força em 10%"
    }
  ]);

  const [newRecord, setNewRecord] = useState({
    student: "",
    weight: "",
    bodyFat: "",
    muscleMass: "",
    measurements: "",
    loads: "",
    goals: "",
    notes: ""
  });

  const { toast } = useToast();

  const handleAddRecord = () => {
    if (!newRecord.student || !newRecord.weight) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o aluno e o peso",
        variant: "destructive",
      });
      return;
    }

    const record: PerformanceRecord = {
      id: records.length + 1,
      ...newRecord,
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newRecord.weight),
      bodyFat: newRecord.bodyFat ? parseFloat(newRecord.bodyFat) : 0,
      muscleMass: newRecord.muscleMass ? parseFloat(newRecord.muscleMass) : 0
    };

    setRecords([...records, record]);
    setNewRecord({
      student: "",
      weight: "",
      bodyFat: "",
      muscleMass: "",
      measurements: "",
      loads: "",
      goals: "",
      notes: ""
    });

    toast({
      title: "Sucesso",
      description: "Registro de desempenho salvo com sucesso!",
    });
  };

  // Funcões para análise de dados
  const getStudentProgress = (studentName: string) => {
    const studentRecords = records
      .filter(r => r.student === studentName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (studentRecords.length < 2) return null;
    
    const first = studentRecords[0];
    const last = studentRecords[studentRecords.length - 1];
    
    return {
      weightChange: last.weight - first.weight,
      bodyFatChange: last.bodyFat - first.bodyFat,
      muscleMassChange: last.muscleMass - first.muscleMass,
      timeSpan: Math.floor((new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  const getStudentEvolution = (studentName: string) => {
    return records
      .filter(r => r.student === studentName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(record => ({
        date: new Date(record.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        weight: record.weight,
        bodyFat: record.bodyFat,
        muscleMass: record.muscleMass
      }));
  };

  const getStudentsComparison = (): StudentComparison[] => {
    const students = [...new Set(records.map(r => r.student))];
    
    return students.map(student => {
      const progress = getStudentProgress(student);
      const studentRecords = records.filter(r => r.student === student);
      const latestRecord = studentRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      return {
        student,
        weightProgress: progress ? progress.weightChange : 0,
        bodyFatProgress: progress ? -progress.bodyFatChange : 0, // Negativo porque redução é positiva
        muscleMassProgress: progress ? progress.muscleMassChange : 0,
        goalAchievement: latestRecord?.goals ? Math.random() * 100 : 0 // Simulado
      };
    });
  };

  const getPerformanceAlerts = () => {
    const alerts = [];
    const comparisons = getStudentsComparison();
    
    comparisons.forEach(comp => {
      if (comp.weightProgress > 5) {
        alerts.push({
          type: 'warning',
          student: comp.student,
          message: 'Ganho de peso acima do esperado'
        });
      }
      if (comp.bodyFatProgress < -2) {
        alerts.push({
          type: 'warning',
          student: comp.student,
          message: 'Perda de gordura corporal muito rápida'
        });
      }
      if (comp.goalAchievement < 30) {
        alerts.push({
          type: 'info',
          student: comp.student,
          message: 'Progresso lento em direção às metas'
        });
      }
    });
    
    return alerts;
  };

  const radarData = getStudentsComparison().map(comp => ({
    student: comp.student,
    peso: Math.abs(comp.weightProgress) * 10,
    gordura: comp.bodyFatProgress * 10,
    musculo: comp.muscleMassProgress * 10,
    metas: comp.goalAchievement
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Performance Avançada
          </h1>
          <p className="text-gray-600 mt-1">Dashboard completo de evolução e comparações</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Avaliação Física</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="student">Aluno</Label>
                <Select value={newRecord.student} onValueChange={(value) => setNewRecord({...newRecord, student: value})}>
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
                <Label htmlFor="weight">Peso (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={newRecord.weight}
                  onChange={(e) => setNewRecord({...newRecord, weight: e.target.value})}
                  placeholder="70.5"
                />
              </div>
              
              <div>
                <Label htmlFor="bodyFat">% Gordura Corporal</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  step="0.1"
                  value={newRecord.bodyFat}
                  onChange={(e) => setNewRecord({...newRecord, bodyFat: e.target.value})}
                  placeholder="15.5"
                />
              </div>
              
              <div>
                <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
                <Input
                  id="muscleMass"
                  type="number"
                  step="0.1"
                  value={newRecord.muscleMass}
                  onChange={(e) => setNewRecord({...newRecord, muscleMass: e.target.value})}
                  placeholder="45.2"
                />
              </div>
              
              <div>
                <Label htmlFor="measurements">Medidas (cm)</Label>
                <Textarea
                  id="measurements"
                  value={newRecord.measurements}
                  onChange={(e) => setNewRecord({...newRecord, measurements: e.target.value})}
                  placeholder="Braço: 40cm, Cintura: 85cm, Coxa: 55cm"
                />
              </div>
              
              <div>
                <Label htmlFor="loads">Cargas (kg)</Label>
                <Textarea
                  id="loads"
                  value={newRecord.loads}
                  onChange={(e) => setNewRecord({...newRecord, loads: e.target.value})}
                  placeholder="Supino: 80kg, Agachamento: 120kg"
                />
              </div>
              
              <div>
                <Label htmlFor="goals">Metas/Objetivos</Label>
                <Textarea
                  id="goals"
                  value={newRecord.goals}
                  onChange={(e) => setNewRecord({...newRecord, goals: e.target.value})}
                  placeholder="Reduzir 2% de gordura corporal em 3 meses"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                  placeholder="Observações adicionais sobre o aluno"
                />
              </div>
              
              <Button onClick={handleAddRecord} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Salvar Avaliação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="comparisons">Comparações</TabsTrigger>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="records">Registros</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            {/* Alertas de Performance */}
            {getPerformanceAlerts().length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-800">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Alertas de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getPerformanceAlerts().map((alert, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="font-medium">{alert.student}</span>
                        <span className="text-sm text-gray-600">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Métricas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                    <Weight className="w-4 h-4 mr-2" />
                    Avaliações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">{records.length}</div>
                  <p className="text-xs text-blue-600 mt-1">Total realizadas</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Média Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">+2.3kg</div>
                  <p className="text-xs text-green-600 mt-1">Massa muscular</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Metas Atingidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-800">78%</div>
                  <p className="text-xs text-purple-600 mt-1">Taxa de sucesso</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-700 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Melhor Resultado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-800">João Silva</div>
                  <p className="text-xs text-yellow-600 mt-1">-2.3% gordura</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Radar de Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Análise Multidimensional dos Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="student" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Performance"
                      dataKey="metas"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparisons">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Progresso entre Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getStudentsComparison()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="student" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="weightProgress" fill="#3B82F6" name="Peso (kg)" />
                    <Bar dataKey="bodyFatProgress" fill="#10B981" name="Gordura (%)" />
                    <Bar dataKey="muscleMassProgress" fill="#F59E0B" name="Músculo (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getStudentsComparison().map((comparison) => (
                <Card key={comparison.student} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{comparison.student}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Peso</span>
                        <span className={`font-medium ${comparison.weightProgress > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {comparison.weightProgress > 0 ? '+' : ''}{comparison.weightProgress.toFixed(1)}kg
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Gordura</span>
                        <span className={`font-medium ${comparison.bodyFatProgress > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {comparison.bodyFatProgress > 0 ? '+' : ''}{comparison.bodyFatProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Músculo</span>
                        <span className={`font-medium ${comparison.muscleMassProgress > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {comparison.muscleMassProgress > 0 ? '+' : ''}{comparison.muscleMassProgress.toFixed(1)}kg
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Metas</span>
                        <span className="font-medium text-purple-600">{comparison.goalAchievement.toFixed(0)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evolution">
          <div className="space-y-6">
            {[...new Set(records.map(r => r.student))].map(student => {
              const evolutionData = getStudentEvolution(student);
              if (evolutionData.length < 2) return null;
              
              return (
                <Card key={student}>
                  <CardHeader>
                    <CardTitle>Evolução - {student}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                        <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={3} name="Peso (kg)" />
                        <Line type="monotone" dataKey="bodyFat" stroke="#EF4444" strokeWidth={3} name="% Gordura" />
                        <Line type="monotone" dataKey="muscleMass" stroke="#10B981" strokeWidth={3} name="Massa Muscular (kg)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="records">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((record) => {
              const progress = getStudentProgress(record.student);
              
              return (
                <Card key={record.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">{record.student}</CardTitle>
                      <span className="text-sm text-gray-500">
                        {new Date(record.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Weight className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Peso</p>
                            <p className="font-semibold">{record.weight} kg</p>
                          </div>
                        </div>
                        
                        {record.bodyFat > 0 && (
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-600">% Gordura</p>
                              <p className="font-semibold">{record.bodyFat}%</p>
                            </div>
                          </div>
                        )}

                        {record.muscleMass > 0 && (
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-purple-600" />
                            <div>
                              <p className="text-sm text-gray-600">Músculo</p>
                              <p className="font-semibold">{record.muscleMass} kg</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {record.measurements && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Ruler className="w-4 h-4 text-purple-600" />
                            <p className="text-sm text-gray-600 font-medium">Medidas</p>
                          </div>
                          <p className="text-sm text-gray-700">{record.measurements}</p>
                        </div>
                      )}
                      
                      {record.loads && (
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-2">Cargas</p>
                          <p className="text-sm text-gray-700">{record.loads}</p>
                        </div>
                      )}

                      {record.goals && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            <p className="text-sm text-gray-600 font-medium">Metas</p>
                          </div>
                          <p className="text-sm text-gray-700">{record.goals}</p>
                        </div>
                      )}

                      {record.notes && (
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-2">Observações</p>
                          <p className="text-sm text-gray-700">{record.notes}</p>
                        </div>
                      )}
                      
                      {progress && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-800 mb-1">Progresso</p>
                          <div className="text-xs text-blue-700">
                            <p>Peso: {progress.weightChange > 0 ? '+' : ''}{progress.weightChange.toFixed(1)}kg</p>
                            {progress.bodyFatChange !== 0 && (
                              <p>Gordura: {progress.bodyFatChange > 0 ? '+' : ''}{progress.bodyFatChange.toFixed(1)}%</p>
                            )}
                            {progress.muscleMassChange !== 0 && (
                              <p>Músculo: {progress.muscleMassChange > 0 ? '+' : ''}{progress.muscleMassChange.toFixed(1)}kg</p>
                            )}
                            <p className="text-gray-500 mt-1">{progress.timeSpan} dias de evolução</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
