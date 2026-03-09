import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSupabaseSKUs, SKU } from '@/hooks/useSupabaseSKUs';
import { Plus, Package, Tag, DollarSign, Repeat, Layers, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const TIPO_LABELS: Record<string, string> = {
  plano: 'Plano',
  consultoria: 'Consultoria',
  programa: 'Programa',
  produto_digital: 'Produto Digital',
  produto_fisico: 'Produto Físico',
  academy: 'Academy',
};

const RECORRENCIA_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  unico: 'Único',
};

const TIPO_COLORS: Record<string, string> = {
  plano: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  consultoria: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  programa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  produto_digital: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  produto_fisico: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  academy: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

export function Catalogo() {
  const { skus, loading, addSKU, updateSKU, deleteSKU } = useSupabaseSKUs();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '', descricao: '', tipo: 'plano', preco: '', recorrencia: 'mensal',
    capacidade: '', modulos_liberados: '', ativo: true,
  });

  const resetForm = () => setForm({
    nome: '', descricao: '', tipo: 'plano', preco: '', recorrencia: 'mensal',
    capacidade: '', modulos_liberados: '', ativo: true,
  });

  const handleAdd = async () => {
    if (!form.nome || !form.preco) return;
    await addSKU({
      nome: form.nome,
      descricao: form.descricao || null,
      tipo: form.tipo,
      preco: parseFloat(form.preco),
      recorrencia: form.recorrencia,
      capacidade: form.capacidade ? parseInt(form.capacidade) : null,
      modulos_liberados: form.modulos_liberados ? form.modulos_liberados.split(',').map(m => m.trim()) : [],
      ativo: form.ativo,
      entregas: [],
      beneficios: [],
      plano_id: null,
    });
    resetForm();
    setIsAddOpen(false);
  };

  const handleDelete = async () => {
    if (deletingId) { await deleteSKU(deletingId); setDeletingId(null); }
  };

  const handleToggle = async (sku: SKU) => {
    await updateSKU(sku.id, { ativo: !sku.ativo } as any);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </div>
    );
  }

  const stats = {
    total: skus.length,
    ativos: skus.filter(s => s.ativo).length,
    receitaPotencial: skus.filter(s => s.ativo).reduce((sum, s) => sum + s.preco, 0),
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Produtos (SKUs)</h1>
          <p className="text-muted-foreground">Gerencie todos os produtos e serviços oferecidos</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Novo SKU</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Adicionar SKU</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Recorrência *</Label>
                  <Select value={form.recorrencia} onValueChange={v => setForm(f => ({ ...f, recorrencia: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(RECORRENCIA_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Preço (R$) *</Label><Input type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} /></div>
                <div><Label>Capacidade</Label><Input type="number" value={form.capacidade} onChange={e => setForm(f => ({ ...f, capacidade: e.target.value }))} placeholder="Ilimitado" /></div>
              </div>
              <div><Label>Módulos Liberados</Label><Input value={form.modulos_liberados} onChange={e => setForm(f => ({ ...f, modulos_liberados: e.target.value }))} placeholder="fitflix, ron, rotinas (separados por vírgula)" /></div>
              <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} /><Label>Ativo</Label></div>
              <Button className="w-full" onClick={handleAdd}>Adicionar SKU</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4" />Total SKUs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Tag className="h-4 w-4" />Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.ativos}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" />Receita Potencial</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">R$ {stats.receitaPotencial.toLocaleString('pt-BR')}</div></CardContent></Card>
      </div>

      {/* SKU Cards */}
      {skus.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum SKU cadastrado. Clique em "Novo SKU" para começar.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skus.map(sku => (
            <Card key={sku.id} className={`transition-all ${!sku.ativo ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{sku.nome}</CardTitle>
                    {sku.descricao && <CardDescription className="mt-1">{sku.descricao}</CardDescription>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(sku)}>
                      <Layers className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(sku.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={TIPO_COLORS[sku.tipo] || ''}>{TIPO_LABELS[sku.tipo] || sku.tipo}</Badge>
                    <Badge variant="outline"><Repeat className="h-3 w-3 mr-1" />{RECORRENCIA_LABELS[sku.recorrencia] || sku.recorrencia}</Badge>
                    {!sku.ativo && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <div className="text-2xl font-bold">R$ {sku.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  {sku.capacidade && <p className="text-sm text-muted-foreground">Capacidade: {sku.capacidade} alunos</p>}
                  {sku.modulos_liberados && sku.modulos_liberados.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sku.modulos_liberados.map(m => <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={() => setDeletingId(null)}
        title="Remover SKU"
        description="Tem certeza que deseja remover este SKU? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </div>
  );
}
