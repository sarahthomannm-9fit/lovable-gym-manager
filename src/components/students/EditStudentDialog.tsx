
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SupabaseStudent } from "@/hooks/useSupabaseStudents";

const diasSemana = [
  { value: 'segunda', label: 'Seg' },
  { value: 'terca', label: 'Ter' },
  { value: 'quarta', label: 'Qua' },
  { value: 'quinta', label: 'Qui' },
  { value: 'sexta', label: 'Sex' },
  { value: 'sabado', label: 'Sáb' },
];

interface EditStudentDialogProps {
  student: SupabaseStudent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudent: (id: string, updates: Partial<SupabaseStudent>) => Promise<void>;
  plans: Array<{ id: string; nome: string; preco: number }>;
}

export function EditStudentDialog({ student, isOpen, onClose, onUpdateStudent, plans }: EditStudentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    nome: "", email: "", telefone: "", endereco: "", plano_id: "",
    valor_mensalidade: "", forma_pagamento: "pix", contato_emergencia: "",
    observacoes_medicas: "", data_nascimento: "", status: "ativo",
    tipo: "presencial" as string, categoria_aluno: "fixo" as string,
    dias_aula: [] as string[], dia_pagamento: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    if (student) {
      setEditData({
        nome: student.nome || "",
        email: student.email || "",
        telefone: student.telefone || "",
        endereco: student.endereco || "",
        plano_id: student.plano_id || "",
        valor_mensalidade: student.valor_mensalidade?.toString() || "",
        forma_pagamento: student.forma_pagamento || "pix",
        contato_emergencia: student.contato_emergencia || "",
        observacoes_medicas: student.observacoes_medicas || "",
        data_nascimento: student.data_nascimento || "",
        status: student.status || "ativo",
        tipo: student.tipo || "presencial",
        categoria_aluno: student.categoria_aluno || "fixo",
        dias_aula: student.dias_aula || [],
        dia_pagamento: student.dia_pagamento?.toString() || "",
      });
    }
  }, [student]);

  const toggleDiaAula = (dia: string) => {
    setEditData(prev => ({
      ...prev,
      dias_aula: prev.dias_aula.includes(dia)
        ? prev.dias_aula.filter(d => d !== dia)
        : [...prev.dias_aula, dia]
    }));
  };

  const handleUpdateStudent = async () => {
    if (!student || !editData.nome || !editData.email) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
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
        status: editData.status,
        tipo: editData.tipo as 'presencial' | 'consultoria',
        categoria_aluno: editData.categoria_aluno as 'fixo' | 'variavel' | 'experimental',
        dias_aula: editData.dias_aula,
        dia_pagamento: editData.dia_pagamento ? parseInt(editData.dia_pagamento) : undefined,
      };

      await onUpdateStudent(student.id, updates);
      onClose();
      toast({ title: "Sucesso", description: "Aluno atualizado com sucesso!" });
    } catch (error) {
      console.error('Error updating student:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar o aluno", variant: "destructive" });
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
            <Input id="nome" value={editData.nome} onChange={(e) => setEditData({...editData, nome: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={editData.telefone} onChange={(e) => setEditData({...editData, telefone: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input id="data_nascimento" type="date" value={editData.data_nascimento} onChange={(e) => setEditData({...editData, data_nascimento: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" value={editData.endereco} onChange={(e) => setEditData({...editData, endereco: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria do Aluno</Label>
              <Select value={editData.categoria_aluno} onValueChange={(value) => setEditData({...editData, categoria_aluno: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixo">Fixo</SelectItem>
                  <SelectItem value="variavel">Variável</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modalidade</Label>
              <Select value={editData.tipo} onValueChange={(value) => setEditData({...editData, tipo: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="consultoria">Consultoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Dias de Aula</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {diasSemana.map(dia => (
                <Button key={dia.value} type="button" size="sm" variant={editData.dias_aula.includes(dia.value) ? 'default' : 'outline'} onClick={() => toggleDiaAula(dia.value)}>
                  {dia.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="plano">Plano</Label>
            <Select value={editData.plano_id} onValueChange={(value) => setEditData({...editData, plano_id: value})}>
              <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>{plan.nome} - R$ {plan.preco.toFixed(2)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor_mensalidade">Mensalidade (R$)</Label>
              <Input id="valor_mensalidade" type="number" step="0.01" value={editData.valor_mensalidade} onChange={(e) => setEditData({...editData, valor_mensalidade: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="dia_pagamento">Dia do Pagamento (1-31)</Label>
              <Input id="dia_pagamento" type="number" min="1" max="31" value={editData.dia_pagamento} onChange={(e) => setEditData({...editData, dia_pagamento: e.target.value})} />
            </div>
          </div>

          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={editData.forma_pagamento} onValueChange={(value) => setEditData({...editData, forma_pagamento: value})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="credito_recorrente">Cartão de Crédito Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contato_emergencia">Contato de Emergência</Label>
            <Input id="contato_emergencia" value={editData.contato_emergencia} onChange={(e) => setEditData({...editData, contato_emergencia: e.target.value})} />
          </div>

          <div>
            <Label htmlFor="observacoes_medicas">Informações Médicas</Label>
            <Textarea id="observacoes_medicas" value={editData.observacoes_medicas} onChange={(e) => setEditData({...editData, observacoes_medicas: e.target.value})} />
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleUpdateStudent} disabled={isLoading} className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
