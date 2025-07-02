import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEquipment: (equipment: {
    name: string;
    category: string;
    brand: string;
    model: string;
    serialNumber: string;
    status: "active" | "maintenance" | "broken" | "retired";
    lastMaintenance: Date;
    nextMaintenance: Date;
    purchaseDate: Date;
    warrantyUntil?: Date;
    location: string;
    notes?: string;
  }) => void;
}

export function AddEquipmentDialog({ open, onOpenChange, onAddEquipment }: AddEquipmentDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    model: "",
    serialNumber: "",
    status: "active" as const,
    lastMaintenance: "",
    nextMaintenance: "",
    purchaseDate: "",
    warrantyUntil: "",
    location: "",
    notes: ""
  });

  const categories = [
    "Cardio",
    "Musculação",
    "Funcional",
    "Acessórios",
    "Outros"
  ];

  const statusOptions = [
    { value: "active", label: "Ativo" },
    { value: "maintenance", label: "Em Manutenção" },
    { value: "broken", label: "Quebrado" },
    { value: "retired", label: "Aposentado" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.brand || !formData.location) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const today = new Date();
    const nextMaintenanceDate = formData.nextMaintenance ? 
      new Date(formData.nextMaintenance) : 
      new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 dias

    onAddEquipment({
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      model: formData.model,
      serialNumber: formData.serialNumber,
      status: formData.status,
      lastMaintenance: formData.lastMaintenance ? new Date(formData.lastMaintenance) : today,
      nextMaintenance: nextMaintenanceDate,
      purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : today,
      warrantyUntil: formData.warrantyUntil ? new Date(formData.warrantyUntil) : undefined,
      location: formData.location,
      notes: formData.notes || undefined
    });

    // Reset form
    setFormData({
      name: "",
      category: "",
      brand: "",
      model: "",
      serialNumber: "",
      status: "active",
      lastMaintenance: "",
      nextMaintenance: "",
      purchaseDate: "",
      warrantyUntil: "",
      location: "",
      notes: ""
    });
    
    onOpenChange(false);
    
    toast({
      title: "Sucesso",
      description: "Equipamento cadastrado com sucesso!"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Equipamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Equipamento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                placeholder="Ex: Esteira Profissional"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({...prev, brand: e.target.value}))}
                placeholder="Ex: TechnoGym"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({...prev, model: e.target.value}))}
                placeholder="Ex: Run Race 1400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Número de Série</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({...prev, serialNumber: e.target.value}))}
                placeholder="Ex: TG001234"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({...prev, status: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localização *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
              placeholder="Ex: Área Cardio - Posição 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Data de Compra</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData(prev => ({...prev, purchaseDate: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyUntil">Garantia até</Label>
              <Input
                id="warrantyUntil"
                type="date"
                value={formData.warrantyUntil}
                onChange={(e) => setFormData(prev => ({...prev, warrantyUntil: e.target.value}))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastMaintenance">Última Manutenção</Label>
              <Input
                id="lastMaintenance"
                type="date"
                value={formData.lastMaintenance}
                onChange={(e) => setFormData(prev => ({...prev, lastMaintenance: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextMaintenance">Próxima Manutenção</Label>
              <Input
                id="nextMaintenance"
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData(prev => ({...prev, nextMaintenance: e.target.value}))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              placeholder="Observações sobre o equipamento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Cadastrar Equipamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}