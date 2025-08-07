
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/types/gym";
import { SupabaseStudent } from "@/hooks/useSupabaseStudents";

interface EditStudentDialogProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudent: (id: string, updates: Partial<SupabaseStudent>) => Promise<void>;
  plans: Array<{ id: string; nome: string; preco: number }>;
}

export function EditStudentDialog({ 
  student, 
  isOpen, 
  onClose, 
  onUpdateStudent, 
  plans 
}: EditStudentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState<{
    nome: string;
    email: string;
    telefone: string;
    endereco: string;
    plano_id: string;
    valor_mensalidade: string;
    forma_pagamento: 'pix' | 'cartao' | 'dinheiro' | 'transferencia';
    contato_emergencia: string;
    observacoes_medicas: string;
    data_nascimento: string;
    status: string;
  }>(() => ({
    nome: student?.name || "",
    email: student?.email || "",
    telefone: student?.phone || "",
    endereco: "",
    plano_id: "",
    valor_mensalidade: student?.monthlyPayment?.toString() || "",
    forma_pagamento: "pix",
    contato_emergencia: student?.emergencyContact || "",
    observacoes_medicas: student?.medicalNotes || "",
    data_nascimento: "",
    status: student?.status || "active"
  }));

  const { toast } = useToast();

  const handleUpdateStudent = async () => {
    if (!student || !editData.nome || !editData.email) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<SupabaseStudent> = {
        nome: editData.nome,
        email: editData.email,
        telefone: editData.telefone || undefined,
        endereco: editData.endereco || undefined,
        plano_id: editData.plano_id || undefined,
        valor_mensalidade: editData.valor_mensalidade ? parseFloat(editData.valor_mensalidade) : undefined,
        forma_pagamento: editData.forma_pagamento,
        contato_emergencia: editData.contato_emergencia || undefined,
        observacoes_medicas: editData.observacoes_medicas || undefined,
        data_nascimento: editData.data_nascimento || undefined,
        status: editData.status
      };

      await onUpdateStudent(student.id.toString(), updates);
      onClose();
      
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o aluno",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Aluno</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={editData.nome}
              onChange={(e) => setEditData({...editData, nome: e.target.value})}
              placeholder="Nome do aluno"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({...editData, email: e.target.value})}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={editData.telefone}
              onChange={(e) => setEditData({...editData, telefone: e.target.value})}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={editData.data_nascimento}
              onChange={(e) => setEditData({...editData, data_nascimento: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={editData.endereco}
              onChange={(e) => setEditData({...editData, endereco: e.target.value})}
              placeholder="Rua, número, cidade"
            />
          </div>
          
          <div>
            <Label htmlFor="plano">Plano</Label>
            <Select value={editData.plano_id} onValueChange={(value) => setEditData({...editData, plano_id: value})}>
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
            <Label htmlFor="valor_mensalidade">Mensalidade (R$)</Label>
            <Input
              id="valor_mensalidade"
              type="number"
              step="0.01"
              value={editData.valor_mensalidade}
              onChange={(e) => setEditData({...editData, valor_mensalidade: e.target.value})}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
            <Select 
              value={editData.forma_pagamento} 
              onValueChange={(value: 'pix' | 'cartao' | 'dinheiro' | 'transferencia') => 
                setEditData({...editData, forma_pagamento: value})
              }
            >
              <SelectTrigger>
                <SelectValue />
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
            <Label htmlFor="status">Status</Label>
            <Select 
              value={editData.status} 
              onValueChange={(value) => setEditData({...editData, status: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contato_emergencia">Contato de Emergência</Label>
            <Input
              id="contato_emergencia"
              value={editData.contato_emergencia}
              onChange={(e) => setEditData({...editData, contato_emergencia: e.target.value})}
              placeholder="Nome e telefone"
            />
          </div>

          <div>
            <Label htmlFor="observacoes_medicas">Informações Médicas</Label>
            <Textarea
              id="observacoes_medicas"
              value={editData.observacoes_medicas}
              onChange={(e) => setEditData({...editData, observacoes_medicas: e.target.value})}
              placeholder="Restrições, lesões, medicamentos..."
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleUpdateStudent} 
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
