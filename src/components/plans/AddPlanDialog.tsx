import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPlan: (plan: {
    name: string;
    price: number;
    duration: number;
    description: string;
    benefits: string[];
    isActive: boolean;
    color: string;
    tipo?: string;
    quantidade_aulas?: number;
  }) => void;
}

const tiposPlano = [
  { value: 'mensal', label: 'Mensal', duracao: '1' },
  { value: 'trimestral', label: 'Trimestral', duracao: '3' },
  { value: 'semestral', label: 'Semestral', duracao: '6' },
  { value: 'anual', label: 'Anual', duracao: '12' },
  { value: 'pacote_aulas', label: 'Pacote de Aulas', duracao: '1' },
  { value: 'consultoria_online', label: 'Consultoria Online', duracao: '1' },
  { value: 'avulso', label: 'Avulso (Aula Única)', duracao: '1' },
];

export function AddPlanDialog({ open, onOpenChange, onAddPlan }: AddPlanDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "", price: "", tipo: "mensal", description: "", color: "bg-blue-500", quantidade_aulas: "",
  });
  const [benefits, setBenefits] = useState<string[]>([""]);

  const colors = [
    { label: "Azul", value: "bg-blue-500" },
    { label: "Verde", value: "bg-green-500" },
    { label: "Roxo", value: "bg-purple-500" },
    { label: "Rosa", value: "bg-pink-500" },
    { label: "Laranja", value: "bg-orange-500" },
    { label: "Vermelho", value: "bg-red-500" }
  ];

  const selectedTipo = tiposPlano.find(t => t.value === formData.tipo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.tipo) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (formData.tipo === 'pacote_aulas' && !formData.quantidade_aulas) {
      toast({ title: "Erro", description: "Informe a quantidade de aulas para o pacote", variant: "destructive" });
      return;
    }

    const validBenefits = benefits.filter(b => b.trim() !== "");

    onAddPlan({
      name: formData.name,
      price: parseFloat(formData.price),
      duration: parseInt(selectedTipo?.duracao || '1'),
      description: formData.description,
      benefits: validBenefits,
      isActive: true,
      color: formData.color,
      tipo: formData.tipo,
      quantidade_aulas: formData.quantidade_aulas ? parseInt(formData.quantidade_aulas) : undefined,
    });

    setFormData({ name: "", price: "", tipo: "mensal", description: "", color: "bg-blue-500", quantidade_aulas: "" });
    setBenefits([""]);
    onOpenChange(false);
    toast({ title: "Sucesso", description: "Plano criado com sucesso!" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Plano</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} placeholder="Ex: Mensal Premium" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))} placeholder="89.90" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Plano *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({...prev, tipo: value}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposPlano.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cor do Plano</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({...prev, color: value}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded ${color.value} mr-2`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.tipo === 'pacote_aulas' && (
            <div className="space-y-2">
              <Label htmlFor="quantidade_aulas">Quantidade de Aulas *</Label>
              <Input id="quantidade_aulas" type="number" min="1" value={formData.quantidade_aulas} onChange={(e) => setFormData(prev => ({...prev, quantidade_aulas: e.target.value}))} placeholder="Ex: 8" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))} placeholder="Descrição do plano..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Benefícios</Label>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input value={benefit} onChange={(e) => { const u = [...benefits]; u[index] = e.target.value; setBenefits(u); }} placeholder="Digite um benefício..." />
                  {benefits.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setBenefits(benefits.filter((_, i) => i !== index))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setBenefits([...benefits, ""])} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Benefício
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Criar Plano</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
