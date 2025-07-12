
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SupabaseClass } from "@/hooks/useSupabaseClasses";

interface AddClassDialogProps {
  onAddClass: (classData: Omit<SupabaseClass, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function AddClassDialog({ onAddClass }: AddClassDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newClass, setNewClass] = useState({
    nome: "",
    data_aula: "",
    horario_inicio: "",
    horario_fim: "",
    tipo: "",
    descricao: "",
    capacidade_maxima: "20",
    dia_semana: ""
  });

  const { toast } = useToast();

  const handleAddClass = async () => {
    if (!newClass.nome || !newClass.data_aula || !newClass.horario_inicio || !newClass.horario_fim) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const classData: Omit<SupabaseClass, 'id' | 'created_at' | 'updated_at'> = {
        nome: newClass.nome,
        data_aula: newClass.data_aula,
        horario_inicio: newClass.horario_inicio,
        horario_fim: newClass.horario_fim,
        tipo: newClass.tipo || undefined,
        descricao: newClass.descricao || undefined,
        capacidade_maxima: parseInt(newClass.capacidade_maxima),
        dia_semana: newClass.dia_semana || undefined,
      };

      await onAddClass(classData);
      
      // Reset form
      setNewClass({
        nome: "",
        data_aula: "",
        horario_inicio: "",
        horario_fim: "",
        tipo: "",
        descricao: "",
        capacidade_maxima: "20",
        dia_semana: ""
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Nova Aula
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Aula</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Aula *</Label>
            <Input
              id="nome"
              value={newClass.nome}
              onChange={(e) => setNewClass({ ...newClass, nome: e.target.value })}
              placeholder="Ex: Treino Funcional"
            />
          </div>

          <div>
            <Label htmlFor="data_aula">Data da Aula *</Label>
            <Input
              id="data_aula"
              type="date"
              value={newClass.data_aula}
              onChange={(e) => setNewClass({ ...newClass, data_aula: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="horario_inicio">Horário Início *</Label>
              <Input
                id="horario_inicio"
                type="time"
                value={newClass.horario_inicio}
                onChange={(e) => setNewClass({ ...newClass, horario_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="horario_fim">Horário Fim *</Label>
              <Input
                id="horario_fim"
                type="time"
                value={newClass.horario_fim}
                onChange={(e) => setNewClass({ ...newClass, horario_fim: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Aula</Label>
            <Select value={newClass.tipo} onValueChange={(value) => setNewClass({ ...newClass, tipo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Musculação">Musculação</SelectItem>
                <SelectItem value="Funcional">Funcional</SelectItem>
                <SelectItem value="HIIT">HIIT</SelectItem>
                <SelectItem value="Cardio">Cardio</SelectItem>
                <SelectItem value="Pilates">Pilates</SelectItem>
                <SelectItem value="Yoga">Yoga</SelectItem>
                <SelectItem value="Natação">Natação</SelectItem>
                <SelectItem value="Dança">Dança</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dia_semana">Dia da Semana</Label>
            <Select value={newClass.dia_semana} onValueChange={(value) => setNewClass({ ...newClass, dia_semana: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Segunda-feira">Segunda-feira</SelectItem>
                <SelectItem value="Terça-feira">Terça-feira</SelectItem>
                <SelectItem value="Quarta-feira">Quarta-feira</SelectItem>
                <SelectItem value="Quinta-feira">Quinta-feira</SelectItem>
                <SelectItem value="Sexta-feira">Sexta-feira</SelectItem>
                <SelectItem value="Sábado">Sábado</SelectItem>
                <SelectItem value="Domingo">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="capacidade_maxima">Capacidade Máxima</Label>
            <Input
              id="capacidade_maxima"
              type="number"
              min="1"
              value={newClass.capacidade_maxima}
              onChange={(e) => setNewClass({ ...newClass, capacidade_maxima: e.target.value })}
              placeholder="20"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={newClass.descricao}
              onChange={(e) => setNewClass({ ...newClass, descricao: e.target.value })}
              placeholder="Descrição da aula..."
            />
          </div>
          
          <Button 
            onClick={handleAddClass} 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            {isLoading ? "Criando..." : "Criar Aula"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
