
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Wrench, AlertTriangle } from "lucide-react";
import { Equipment } from "@/types/gym";

interface EquipmentCardProps {
  equipment: Equipment;
  onUpdateEquipment: (id: number, data: Partial<Equipment>) => void;
}

export function EquipmentCard({ equipment, onUpdateEquipment }: EquipmentCardProps) {
  const getStatusInfo = (status: string) => {
    switch(status) {
      case "working":
        return { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Ativo" };
      case "maintenance":
        return { color: "bg-yellow-100 text-yellow-800", icon: Wrench, label: "Manutenção" };
      case "broken":
        return { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Quebrado" };
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

  const isMaintenanceDue = (nextMaintenance?: string) => {
    if (!nextMaintenance) return false;
    const daysUntil = Math.ceil((new Date(nextMaintenance).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return daysUntil <= 7;
  };

  const statusInfo = getStatusInfo(equipment.status);
  const StatusIcon = statusInfo.icon;
  const maintenanceDue = isMaintenanceDue(equipment.nextMaintenance);

  return (
    <Card className={`hover:shadow-lg transition-shadow ${maintenanceDue ? 'border-orange-200' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{equipment.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={getCategoryColor(equipment.type)}>
              {equipment.type}
            </Badge>
            <Badge className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Custo:</span>
            <span className="font-medium ml-1">R$ {equipment.cost.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600">Aquisição:</span>
            <span className="font-medium ml-1">{new Date(equipment.acquisitionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <div className="space-y-2">
          {equipment.lastMaintenance && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Última manutenção:</span>
              <span>{new Date(equipment.lastMaintenance + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          
          {equipment.nextMaintenance && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Próxima manutenção:</span>
              <span className={maintenanceDue ? "font-bold text-orange-600" : ""}>
                {new Date(equipment.nextMaintenance + 'T00:00:00').toLocaleDateString('pt-BR')}
                {maintenanceDue && " ⚠️"}
              </span>
            </div>
          )}

          {equipment.warranty && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Garantia:</span>
              <span>{equipment.warranty}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t">
          <Button variant="outline" size="sm">
            Editar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onUpdateEquipment(equipment.id, { status: equipment.status === 'working' ? 'maintenance' : 'working' })}
          >
            <Wrench className="w-4 h-4 mr-1" />
            {equipment.status === 'working' ? 'Manutenção' : 'Ativar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
