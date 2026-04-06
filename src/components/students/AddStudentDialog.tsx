
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Copy, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SupabaseStudent } from "@/hooks/useSupabaseStudents";
import { supabase } from "@/integrations/supabase/client";

interface AddStudentDialogProps {
  onAddStudent: (student: Omit<SupabaseStudent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  plans: Array<{ id: string; nome: string; preco: number }>;
}

const diasSemana = [
  { value: 'segunda', label: 'Seg' },
  { value: 'terca', label: 'Ter' },
  { value: 'quarta', label: 'Qua' },
  { value: 'quinta', label: 'Qui' },
  { value: 'sexta', label: 'Sex' },
  { value: 'sabado', label: 'Sáb' },
];

export function AddStudentDialog({ onAddStudent, plans }: AddStudentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    nome: "",
    email: "",
    telefone: "",
    plano_id: "",
    valor_mensalidade: "",
    forma_pagamento: "pix",
    contato_emergencia: "",
    observacoes_medicas: "",
    data_nascimento: "",
    endereco: "",
    tipo: "presencial" as 'presencial' | 'consultoria',
    categoria_aluno: "fixo" as 'fixo' | 'variavel' | 'experimental',
    dias_aula: [] as string[],
    dia_pagamento: "",
  });

  const { toast } = useToast();

  const toggleDiaAula = (dia: string) => {
    setNewStudent(prev => ({
      ...prev,
      dias_aula: prev.dias_aula.includes(dia)
        ? prev.dias_aula.filter(d => d !== dia)
        : [...prev.dias_aula, dia]
    }));
  };

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
      const selectedPlan = plans.find(p => p.id === newStudent.plano_id);
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
        tipo: newStudent.tipo,
        categoria_aluno: newStudent.categoria_aluno,
        dias_aula: newStudent.dias_aula,
        dia_pagamento: newStudent.dia_pagamento ? parseInt(newStudent.dia_pagamento) : undefined,
      };

      await onAddStudent(studentData);

      // Generate anamnese link
      try {
        // Find newly created student by email
        const { data: newStudents } = await supabase
          .from('alunos')
          .select('id')
          .eq('email', studentData.email)
          .order('created_at', { ascending: false })
          .limit(1);

        if (newStudents && newStudents.length > 0) {
          const token = crypto.randomUUID();
          await supabase.from('anamnese_respostas').insert({
            aluno_id: newStudents[0].id,
            token,
            tipo: 'par_q',
          });
          const link = `${window.location.origin}/anamnese/${token}`;
          await navigator.clipboard.writeText(link);
          toast({
            title: "Aluno cadastrado + Link PAR-Q copiado!",
            description: `Link da anamnese copiado para a área de transferência. Envie ao aluno.`,
          });
        }
      } catch (e) {
        console.error('Error creating anamnese link:', e);
      }

      setNewStudent({
        nome: "", email: "", telefone: "", plano_id: "", valor_mensalidade: "",
        forma_pagamento: "pix", contato_emergencia: "", observacoes_medicas: "",
        data_nascimento: "", endereco: "", tipo: "presencial",
        categoria_aluno: "fixo", dias_aula: [], dia_pagamento: "",
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
            <Input id="nome" value={newStudent.nome} onChange={(e) => setNewStudent({...newStudent, nome: e.target.value})} placeholder="Nome do aluno" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input id="telefone" value={newStudent.telefone} onChange={(e) => setNewStudent({...newStudent, telefone: e.target.value})} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input id="data_nascimento" type="date" value={newStudent.data_nascimento} onChange={(e) => setNewStudent({...newStudent, data_nascimento: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" value={newStudent.endereco} onChange={(e) => setNewStudent({...newStudent, endereco: e.target.value})} placeholder="Rua, número, cidade" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria do Aluno</Label>
              <Select value={newStudent.categoria_aluno} onValueChange={(value: 'fixo' | 'variavel' | 'experimental') => setNewStudent({...newStudent, categoria_aluno: value})}>
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
              <Select value={newStudent.tipo} onValueChange={(value: 'presencial' | 'consultoria') => setNewStudent({...newStudent, tipo: value})}>
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
                <Button
                  key={dia.value}
                  type="button"
                  size="sm"
                  variant={newStudent.dias_aula.includes(dia.value) ? 'default' : 'outline'}
                  onClick={() => toggleDiaAula(dia.value)}
                >
                  {dia.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="plano">Plano</Label>
            <Select value={newStudent.plano_id} onValueChange={(value) => setNewStudent({...newStudent, plano_id: value})}>
              <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.nome} - R$ {plan.preco.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor_mensalidade">Mensalidade (R$) *</Label>
              <Input id="valor_mensalidade" type="number" step="0.01" value={newStudent.valor_mensalidade} onChange={(e) => setNewStudent({...newStudent, valor_mensalidade: e.target.value})} placeholder="0,00" />
            </div>
            <div>
              <Label htmlFor="dia_pagamento">Dia do Pagamento (1-31)</Label>
              <Input id="dia_pagamento" type="number" min="1" max="31" value={newStudent.dia_pagamento} onChange={(e) => setNewStudent({...newStudent, dia_pagamento: e.target.value})} placeholder="10" />
            </div>
          </div>

          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={newStudent.forma_pagamento} onValueChange={(value) => setNewStudent({...newStudent, forma_pagamento: value})}>
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
            <Label htmlFor="contato_emergencia">Contato de Emergência</Label>
            <Input id="contato_emergencia" value={newStudent.contato_emergencia} onChange={(e) => setNewStudent({...newStudent, contato_emergencia: e.target.value})} placeholder="Nome e telefone" />
          </div>

          <div>
            <Label htmlFor="observacoes_medicas">Informações Médicas</Label>
            <Textarea id="observacoes_medicas" value={newStudent.observacoes_medicas} onChange={(e) => setNewStudent({...newStudent, observacoes_medicas: e.target.value})} placeholder="Restrições, lesões, medicamentos..." />
          </div>
          
          <Button onClick={handleAddStudent} disabled={isLoading} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
            {isLoading ? "Cadastrando..." : "Cadastrar Aluno"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
