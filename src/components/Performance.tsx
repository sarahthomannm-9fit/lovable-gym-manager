
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp, Weight, Ruler } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Performance() {
  const [records, setRecords] = useState([
    {
      id: 1,
      student: "João Silva",
      date: "2024-01-15",
      weight: 78.5,
      bodyFat: 15.2,
      measurements: "Braço: 38cm, Cintura: 85cm, Coxa: 56cm",
      loads: "Supino: 80kg, Agachamento: 120kg, Levantamento: 100kg"
    },
    {
      id: 2,
      student: "Maria Santos",
      date: "2024-01-10",
      weight: 62.0,
      bodyFat: 22.5,
      measurements: "Braço: 28cm, Cintura: 68cm, Coxa: 48cm",
      loads: "Supino: 40kg, Agachamento: 60kg, Levantamento: 50kg"
    },
    {
      id: 3,
      student: "Pedro Costa",
      date: "2024-01-08",
      weight: 85.2,
      bodyFat: 18.7,
      measurements: "Braço: 42cm, Cintura: 92cm, Coxa: 62cm",
      loads: "Supino: 95kg, Agachamento: 140kg, Levantamento: 120kg"
    }
  ]);

  const [newRecord, setNewRecord] = useState({
    student: "",
    weight: "",
    bodyFat: "",
    measurements: "",
    loads: ""
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

    const record = {
      id: records.length + 1,
      ...newRecord,
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newRecord.weight),
      bodyFat: newRecord.bodyFat ? parseFloat(newRecord.bodyFat) : 0
    };

    setRecords([...records, record]);
    setNewRecord({
      student: "",
      weight: "",
      bodyFat: "",
      measurements: "",
      loads: ""
    });

    toast({
      title: "Sucesso",
      description: "Registro de desempenho salvo com sucesso!",
    });
  };

  const getStudentProgress = (studentName: string) => {
    const studentRecords = records
      .filter(r => r.student === studentName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (studentRecords.length < 2) return null;
    
    const first = studentRecords[0];
    const last = studentRecords[studentRecords.length - 1];
    
    return {
      weightChange: last.weight - first.weight,
      bodyFatChange: last.bodyFat - first.bodyFat
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Desempenho Físico
          </h1>
          <p className="text-gray-600 mt-1">Acompanhe a evolução dos seus alunos</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Avaliação Física</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
              
              <Button onClick={handleAddRecord} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Salvar Avaliação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                  <div className="grid grid-cols-2 gap-4">
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
                  
                  {progress && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-1">Progresso</p>
                      <div className="text-xs text-blue-700">
                        <p>Peso: {progress.weightChange > 0 ? '+' : ''}{progress.weightChange.toFixed(1)}kg</p>
                        {progress.bodyFatChange !== 0 && (
                          <p>Gordura: {progress.bodyFatChange > 0 ? '+' : ''}{progress.bodyFatChange.toFixed(1)}%</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
