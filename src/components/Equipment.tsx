
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { AddEquipmentDialog } from "./equipment/AddEquipmentDialog";
import { EquipmentStats } from "./equipment/EquipmentStats";
import { EquipmentCard } from "./equipment/EquipmentCard";
import { useGymData } from "@/contexts/GymDataContext";

export function Equipment() {
  const { equipment, addEquipment, updateEquipment } = useGymData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEquipment = (newEquipment: any) => {
    addEquipment({
      name: newEquipment.name,
      type: newEquipment.category || newEquipment.type,
      status: 'working',
      acquisitionDate: newEquipment.purchaseDate || new Date().toISOString().split('T')[0],
      cost: newEquipment.cost || 0
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gestão de Equipamentos
          </h1>
          <p className="text-gray-600 mt-1">Controle e manutenção dos equipamentos</p>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
            onUpdateEquipment={updateEquipment}
          />
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {equipment.length === 0 ? "Nenhum equipamento cadastrado" : "Nenhum equipamento encontrado"}
          </p>
          {equipment.length === 0 && (
            <p className="text-sm text-gray-400 mt-1">Cadastre seu primeiro equipamento para começar</p>
          )}
        </div>
      )}

      <AddEquipmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddEquipment={handleAddEquipment}
      />
    </div>
  );
}
