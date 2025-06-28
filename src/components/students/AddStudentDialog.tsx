
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  startDate: string;
  paymentMethod?: string;
  emergencyContact?: string;
  medicalInfo?: string;
}

interface AddStudentDialogProps {
  onAddStudent: (student: Omit<Student, 'id' | 'status' | 'startDate'>) => void;
}

export function AddStudentDialog({ onAddStudent }: AddStudentDialogProps) {
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "",
    paymentMethod: "",
    emergencyContact: "",
    medicalInfo: ""
  });

  const { toast } = useToast();

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.email || !newStudent.phone || !newStudent.plan) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    onAddStudent(newStudent);
    setNewStudent({
      name: "",
      email: "",
      phone: "",
      plan: "",
      paymentMethod: "",
      emergencyContact: "",
      medicalInfo: ""
    });

    toast({
      title: "Sucesso",
      description: "Aluno cadastrado com sucesso!",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Novo Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={newStudent.name}
              onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
              placeholder="Nome do aluno"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={newStudent.phone}
              onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
              placeholder="(11) 99999-9999"
            />
          </div>
          
          <div>
            <Label htmlFor="plan">Plano *</Label>
            <Select value={newStudent.plan} onValueChange={(value) => setNewStudent({...newStudent, plan: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mensal">Mensal</SelectItem>
                <SelectItem value="Trimestral">Trimestral</SelectItem>
                <SelectItem value="Semestral">Semestral</SelectItem>
                <SelectItem value="Anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <Select value={newStudent.paymentMethod} onValueChange={(value) => setNewStudent({...newStudent, paymentMethod: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="emergencyContact">Contato de Emergência</Label>
            <Input
              id="emergencyContact"
              value={newStudent.emergencyContact}
              onChange={(e) => setNewStudent({...newStudent, emergencyContact: e.target.value})}
              placeholder="Nome e telefone"
            />
          </div>

          <div>
            <Label htmlFor="medicalInfo">Informações Médicas</Label>
            <Textarea
              id="medicalInfo"
              value={newStudent.medicalInfo}
              onChange={(e) => setNewStudent({...newStudent, medicalInfo: e.target.value})}
              placeholder="Restrições, lesões, medicamentos..."
            />
          </div>
          
          <Button onClick={handleAddStudent} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
            Cadastrar Aluno
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
