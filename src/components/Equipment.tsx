import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AddEquipmentDialog } from "./equipment/AddEquipmentDialog";
import { EquipmentStats } from "./equipment/EquipmentStats";
import { EquipmentCard } from "./equipment/EquipmentCard";
import { Equipment as EquipmentType } from "@/types/gym";

// Local state for equipment management (could be migrated to Supabase later)
export function Equipment() {
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEquipment = (newEquipment: any) => {
    const equipmentItem: EquipmentType = {
      id: Date.now(),
      name: newEquipment.name,
      type: newEquipment.category || newEquipment.type,
      status: 'working',
      acquisitionDate: newEquipment.purchaseDate || new Date().toISOString().split('T')[0],
      cost: newEquipment.cost || 0
    };
    setEquipment(prev => [...prev, equipmentItem]);
  };

  const handleUpdateEquipment = (id: number, updates: Partial<EquipmentType>) => {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gestão de Equipamentos
          </h1>
          <p className="text-muted-foreground mt-1">Controle e manutenção dos equipamentos</p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Equipamento
        </Button>
      </div>

      <EquipmentStats equipment={equipment} />

      {/* Busca */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar equipamentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Equipamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEquipment.map((item) => (
          <EquipmentCard 
            key={item.id} 
            equipment={item} 
            onUpdateEquipment={handleUpdateEquipment}
          />
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {equipment.length === 0 ? "Nenhum equipamento cadastrado" : "Nenhum equipamento encontrado"}
            </p>
            {equipment.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">Cadastre seu primeiro equipamento para começar</p>
            )}
          </CardContent>
        </Card>
      )}

      <AddEquipmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddEquipment={handleAddEquipment}
      />
    </div>
  );
}