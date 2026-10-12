import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Wrench } from "lucide-react";
import { AddEquipmentDialog } from "./equipment/AddEquipmentDialog";
import { EquipmentStats } from "./equipment/EquipmentStats";
import { EquipmentCard, EquipmentItem } from "./equipment/EquipmentCard";
import { useSupabaseEquipment } from "@/hooks/useSupabaseEquipment";
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { toast } from 'sonner';

export function Equipment() {
  const { equipment: supabaseEquipment, maintenanceEvents, loading, addEquipment, refetch } = useSupabaseEquipment();
  const { activeOrg } = useOperationalContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Map Supabase data to EquipmentItem format
  const equipment: EquipmentItem[] = supabaseEquipment.map(e => ({
    id: e.id,
    name: e.nome,
    type: e.tipo,
    status: (e.status === 'funcionando' ? 'working' : e.status === 'em_manutencao' ? 'maintenance' : 'broken') as EquipmentItem['status'],
    acquisitionDate: e.data_aquisicao || '',
    cost: e.custo || 0,
    nextMaintenance: e.proxima_manutencao || undefined,
    lastMaintenance: maintenanceEvents.find((event) => event.equipment_id === e.id && event.action === 'completed')?.occurred_at.slice(0, 10),
  }));

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEquipment = async (newEquipment: any) => {
    await addEquipment({
      nome: newEquipment.name,
      tipo: newEquipment.category || newEquipment.type || 'musculacao',
      status: 'funcionando',
      data_aquisicao: newEquipment.purchaseDate instanceof Date ? newEquipment.purchaseDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      custo: newEquipment.cost || 0,
      localizacao: newEquipment.location,
      marca: newEquipment.brand,
      modelo: newEquipment.model,
      numero_serie: newEquipment.serialNumber,
      proxima_manutencao: newEquipment.nextMaintenance instanceof Date ? newEquipment.nextMaintenance.toISOString().split('T')[0] : null,
      observacoes: newEquipment.notes,
    });
  };

  const handleUpdateEquipment = async (id: string, updates: Partial<EquipmentItem>) => {
    const action = updates.status === 'maintenance' ? 'opened' : 'completed';
    const detail = window.prompt(action === 'opened' ? 'Descreva o motivo da manutenção' : 'Descreva a manutenção concluída');
    if (!detail) return;
    const { error } = await supabase.rpc('record_equipment_maintenance' as any, { p_equipment_id: id, p_action: action, p_detail: detail });
    if (error) { toast.error(error.message); return; }
    toast.success('Manutenção registrada.'); await refetch();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg">Carregando equipamentos...</div></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Gestão de Equipamentos</h1>
          <p className="text-muted-foreground mt-1">Controle e manutenção dos equipamentos</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} disabled={!activeOrg}><Plus className="w-4 h-4 mr-2" />Novo Equipamento</Button>
      </div>

      <EquipmentStats equipment={equipment} />
      {!activeOrg && <p className="text-sm text-muted-foreground">Selecione uma organização para gerenciar equipamentos.</p>}

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Buscar equipamentos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEquipment.map((item) => (
          <EquipmentCard key={item.id} equipment={item} onUpdateEquipment={handleUpdateEquipment} />
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{equipment.length === 0 ? "Nenhum equipamento cadastrado" : "Nenhum equipamento encontrado"}</p>
            {equipment.length === 0 && <p className="text-sm text-muted-foreground mt-1">Cadastre seu primeiro equipamento para começar</p>}
          </CardContent>
        </Card>
      )}

      <AddEquipmentDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddEquipment={handleAddEquipment} />
    </div>
  );
}

