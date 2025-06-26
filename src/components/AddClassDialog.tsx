
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewClass {
  student: string;
  date: string;
  time: string;
  type: string;
}

interface AddClassDialogProps {
  onAddClass: (classItem: NewClass) => void;
}

export function AddClassDialog({ onAddClass }: AddClassDialogProps) {
  const [newClass, setNewClass] = useState<NewClass>({
    student: "",
    date: "",
    time: "",
    type: ""
  });
  const [open, setOpen] = useState(false);
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

    onAddClass(newClass);
    setNewClass({
      student: "",
      date: "",
      time: "",
      type: ""
    });
    setOpen(false);

    toast({
      title: "Sucesso",
      description: "Aula agendada com sucesso!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nova Aula</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Nova Aula</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="student">Aluno</Label>
            <Input
              id="student"
              value={newClass.student}
              onChange={(e) => setNewClass({ ...newClass, student: e.target.value })}
              placeholder="Nome do aluno"
            />
          </div>
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={newClass.date}
              onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="time">Horário</Label>
            <Input
              id="time"
              type="time"
              value={newClass.time}
              onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="type">Tipo de Aula</Label>
            <Select value={newClass.type} onValueChange={(value) => setNewClass({ ...newClass, type: value })}>
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
          <Button onClick={handleAddClass} className="w-full">
            Agendar Aula
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
