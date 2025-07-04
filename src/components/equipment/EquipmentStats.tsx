
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Equipment } from "@/types/gym";

interface EquipmentStatsProps {
  equipment: Equipment[];
}

export function EquipmentStats({ equipment }: EquipmentStatsProps) {
  const isMaintenanceDue = (nextMaintenance?: string) => {
    if (!nextMaintenance) return false;
    const daysUntil = Math.ceil((new Date(nextMaintenance).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return daysUntil <= 7;
  };

  const stats = {
    total: equipment.length,
    active: equipment.filter(e => e.status === "working").length,
    maintenance: equipment.filter(e => e.status === "maintenance").length,
    maintenanceDue: equipment.filter(e => isMaintenanceDue(e.nextMaintenance)).length
  };

  return (
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
  );
}
