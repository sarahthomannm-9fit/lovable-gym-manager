import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SupabaseStudent } from "@/hooks/useSupabaseStudents";

interface AddStudentDialogProps {
  onAddStudent: (student: Omit<SupabaseStudent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  plans: Array<{ id: string; nome: string; preco: number }>;
}

export function AddStudentDialog({ onAddStudent, plans }: AddStudentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newStudent, setNewStudent] = useState<{
    nome: string;
    email: string;
    telefone: string;
    plano_id: string;
    valor_mensalidade: string;
    forma_pagamento: 'pix' | 'cartao' | 'dinheiro' | 'transferencia';
    contato_emergencia: string;
    observacoes_medicas: string;
    data_nascimento: string;
    endereco: string;
  }>({
    nome: "",
    email: "",
    telefone: "",
    plano_id: "",
    valor_mensalidade: "",
    forma_pagamento: "pix",
    contato_emergencia: "",
    observacoes_medicas: "",
    data_nascimento: "",
    endereco: ""
  });

  const { toast } = useToast();

  const handleAddStudent = async () => {
    if (!newStudent.nome || !newStudent.email || !newStudent.telefone || !newStudent.valor_mensalidade) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const studentData: Omit<SupabaseStudent, 'id' | 'created_at' | 'updated_at'> = {
        nome: newStudent.nome,
        email: newStudent.email,
        telefone: newStudent.telefone,
        plano_id: newStudent.plano_id || undefined,
        valor_mensalidade: parseFloat(newStudent.valor_mensalidade),
        forma_pagamento: newStudent.forma_pagamento,
        contato_emergencia: newStudent.contato_emergencia || undefined,
        observacoes_medicas: newStudent.observacoes_medicas || undefined,
        data_nascimento: newStudent.data_nascimento || undefined,
        endereco: newStudent.endereco || undefined,
        status: 'ativo',
        data_matricula: new Date().toISOString().split('T')[0],
        aulas_disponiveis: 0,
        aulas_por_mes: 0,
      };

      await onAddStudent(studentData);
      
      // Reset form
      setNewStudent({
        nome: "",
        email: "",
        telefone: "",
        plano_id: "",
        valor_mensalidade: "",
        forma_pagamento: "pix",
        contato_emergencia: "",
        observacoes_medicas: "",
        data_nascimento: "",
        endereco: ""
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Novo Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={newStudent.nome}
              onChange={(e) => setNewStudent({...newStudent, nome: e.target.value})}
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
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              value={newStudent.telefone}
              onChange={(e) => setNewStudent({...newStudent, telefone: e.target.value})}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={newStudent.data_nascimento}
              onChange={(e) => setNewStudent({...newStudent, data_nascimento: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={newStudent.endereco}
              onChange={(e) => setNewStudent({...newStudent, endereco: e.target.value})}
              placeholder="Rua, número, cidade"
            />
          </div>
          
          <div>
            <Label htmlFor="plano">Plano</Label>
            <Select value={newStudent.plano_id} onValueChange={(value) => setNewStudent({...newStudent, plano_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.nome} - R$ {plan.preco.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="valor_mensalidade">Mensalidade (R$) *</Label>
            <Input
              id="valor_mensalidade"
              type="number"
              step="0.01"
              value={newStudent.valor_mensalidade}
              onChange={(e) => setNewStudent({...newStudent, valor_mensalidade: e.target.value})}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
            <Select 
              value={newStudent.forma_pagamento} 
              onValueChange={(value: 'pix' | 'cartao' | 'dinheiro' | 'transferencia') => 
                setNewStudent({...newStudent, forma_pagamento: value})
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contato_emergencia">Contato de Emergência</Label>
            <Input
              id="contato_emergencia"
              value={newStudent.contato_emergencia}
              onChange={(e) => setNewStudent({...newStudent, contato_emergencia: e.target.value})}
              placeholder="Nome e telefone"
            />
          </div>

          <div>
            <Label htmlFor="observacoes_medicas">Informações Médicas</Label>
            <Textarea
              id="observacoes_medicas"
              value={newStudent.observacoes_medicas}
              onChange={(e) => setNewStudent({...newStudent, observacoes_medicas: e.target.value})}
              placeholder="Restrições, lesões, medicamentos..."
            />
          </div>
          
          <Button 
            onClick={handleAddStudent} 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            {isLoading ? "Cadastrando..." : "Cadastrar Aluno"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
