
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddRecordDialogProps {
  onAddRecord: (record: any) => void;
}

export function AddRecordDialog({ onAddRecord }: AddRecordDialogProps) {
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

    const record = {
      ...newRecord,
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newRecord.weight),
      bodyFat: newRecord.bodyFat ? parseFloat(newRecord.bodyFat) : 0,
      muscleMass: newRecord.muscleMass ? parseFloat(newRecord.muscleMass) : 0
    };

    onAddRecord(record);
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

  return (
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
  );
}
