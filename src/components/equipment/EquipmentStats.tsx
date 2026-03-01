
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentItem } from "./EquipmentCard";

interface EquipmentStatsProps {
  equipment: EquipmentItem[];
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
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-muted-foreground mt-1">Equipamentos cadastrados</p></CardContent>
      </Card>
      <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ativos</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.active}</div><p className="text-xs text-muted-foreground mt-1">Em funcionamento</p></CardContent>
      </Card>
      <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Em Manutenção</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.maintenance}</div><p className="text-xs text-muted-foreground mt-1">Equipamentos parados</p></CardContent>
      </Card>
      <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Manutenção Vencendo</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.maintenanceDue}</div><p className="text-xs text-muted-foreground mt-1">Próxima semana</p></CardContent>
      </Card>
    </div>
  );
}
