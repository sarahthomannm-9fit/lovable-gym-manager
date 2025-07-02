import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Wrench, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { AddEquipmentDialog } from "./equipment/AddEquipmentDialog";

interface Equipment {
  id: string;
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
}

export function Equipment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([
    {
      id: "1",
      name: "Esteira Profissional",
      category: "Cardio",
      brand: "TechnoGym",
      model: "Run Race 1400",
      serialNumber: "TG001234",
      status: "active",
      lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      purchaseDate: new Date(2023, 0, 15),
      warrantyUntil: new Date(2025, 0, 15),
      location: "Área Cardio - Posição 1"
    },
    {
      id: "2",
      name: "Supino Reto",
      category: "Musculação",
      brand: "Biotech",
      model: "Premium Line",
      serialNumber: "BT005678",
      status: "maintenance",
      lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
      purchaseDate: new Date(2022, 5, 10),
      location: "Área de Peito - Centro",
      notes: "Cabo do ajuste de altura com defeito"
    },
    {
      id: "3",
      name: "Leg Press 45°",
      category: "Musculação",
      brand: "Movement",
      model: "Titanium",
      serialNumber: "MV009876",
      status: "active",
      lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      purchaseDate: new Date(2023, 8, 20),
      warrantyUntil: new Date(2025, 8, 20),
      location: "Área de Pernas"
    }
  ]);

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusInfo = (status: string) => {
    switch(status) {
      case "active":
        return { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Ativo" };
      case "maintenance":
        return { color: "bg-yellow-100 text-yellow-800", icon: Wrench, label: "Manutenção" };
      case "broken":
        return { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Quebrado" };
      case "retired":
        return { color: "bg-gray-100 text-gray-800", icon: Calendar, label: "Aposentado" };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: CheckCircle, label: "Desconhecido" };
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category.toLowerCase()) {
      case "cardio": return "bg-blue-100 text-blue-800";
      case "musculação": return "bg-purple-100 text-purple-800";
      case "funcional": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isMaintenanceDue = (nextMaintenance: Date) => {
    const daysUntil = Math.ceil((nextMaintenance.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return daysUntil <= 7;
  };

  const handleAddEquipment = (newEquipment: Omit<Equipment, "id">) => {
    const equipment_item: Equipment = {
      ...newEquipment,
      id: Date.now().toString()
    };
    setEquipment(prev => [...prev, equipment_item]);
  };

  const stats = {
    total: equipment.length,
    active: equipment.filter(e => e.status === "active").length,
    maintenance: equipment.filter(e => e.status === "maintenance").length,
    maintenanceDue: equipment.filter(e => isMaintenanceDue(e.nextMaintenance)).length
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total de Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
            <p className="text-xs text-blue-600 mt-1">Equipamentos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stats.active}</div>
            <p className="text-xs text-green-600 mt-1">Em funcionamento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Em Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{stats.maintenance}</div>
            <p className="text-xs text-yellow-600 mt-1">Equipamentos parados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Manutenção Vencendo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{stats.maintenanceDue}</div>
            <p className="text-xs text-red-600 mt-1">Próxima semana</p>
          </CardContent>
        </Card>
      </div>

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
        {filteredEquipment.map((item) => {
          const statusInfo = getStatusInfo(item.status);
          const StatusIcon = statusInfo.icon;
          const maintenanceDue = isMaintenanceDue(item.nextMaintenance);

          return (
            <Card key={item.id} className={`hover:shadow-lg transition-shadow ${maintenanceDue ? 'border-orange-200' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  {item.brand} - {item.model}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Série:</span>
                    <span className="font-medium ml-1">{item.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Local:</span>
                    <span className="font-medium ml-1">{item.location}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Última manutenção:</span>
                    <span>{item.lastMaintenance.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Próxima manutenção:</span>
                    <span className={maintenanceDue ? "font-bold text-orange-600" : ""}>
                      {item.nextMaintenance.toLocaleDateString()}
                      {maintenanceDue && " ⚠️"}
                    </span>
                  </div>

                  {item.warrantyUntil && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Garantia até:</span>
                      <span>{item.warrantyUntil.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {item.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{item.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Wrench className="w-4 h-4 mr-1" />
                    Manutenção
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    Histórico
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum equipamento encontrado</p>
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