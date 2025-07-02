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
  }) => void;
}

export function AddPlanDialog({ open, onOpenChange, onAddPlan }: AddPlanDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "",
    description: "",
    color: "bg-blue-500"
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

  const durations = [
    { label: "1 Mês", value: "1" },
    { label: "3 Meses", value: "3" },
    { label: "6 Meses", value: "6" },
    { label: "12 Meses", value: "12" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.duration) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const validBenefits = benefits.filter(benefit => benefit.trim() !== "");
    
    if (validBenefits.length === 0) {
      toast({
        title: "Erro", 
        description: "Adicione pelo menos um benefício",
        variant: "destructive"
      });
      return;
    }

    onAddPlan({
      name: formData.name,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      description: formData.description,
      benefits: validBenefits,
      isActive: true,
      color: formData.color
    });

    // Reset form
    setFormData({
      name: "",
      price: "",
      duration: "",
      description: "",
      color: "bg-blue-500"
    });
    setBenefits([""]);
    
    onOpenChange(false);
    
    toast({
      title: "Sucesso",
      description: "Plano criado com sucesso!"
    });
  };

  const addBenefit = () => {
    setBenefits([...benefits, ""]);
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const updateBenefit = (index: number, value: string) => {
    const updatedBenefits = [...benefits];
    updatedBenefits[index] = value;
    setBenefits(updatedBenefits);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Plano</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                placeholder="Ex: Mensal Premium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                placeholder="89.90"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duração *</Label>
              <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({...prev, duration: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor do Plano</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({...prev, color: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              placeholder="Descrição do plano..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Benefícios *</Label>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder="Digite um benefício..."
                  />
                  {benefits.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBenefit}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Benefício
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Plano
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}