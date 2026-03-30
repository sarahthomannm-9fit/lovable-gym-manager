import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSupabaseSKUs, SKU } from '@/hooks/useSupabaseSKUs';
import { PageShell } from '@/components/warroom/PageShell';
import { Plus, Package, Repeat, Layers, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';

const TIPO_LABELS: Record<string, string> = { plano: 'Plano', consultoria: 'Consultoria', programa: 'Programa', produto_digital: 'P. Digital', produto_fisico: 'P. Físico', academy: 'Academy' };
const RECORRENCIA_LABELS: Record<string, string> = { mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual', unico: 'Único' };

export function Catalogo() {
  const { skus, loading, addSKU, updateSKU, deleteSKU } = useSupabaseSKUs();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', tipo: 'plano', preco: '', recorrencia: 'mensal', capacidade: '', modulos_liberados: '', ativo: true });

  const resetForm = () => setForm({ nome: '', descricao: '', tipo: 'plano', preco: '', recorrencia: 'mensal', capacidade: '', modulos_liberados: '', ativo: true });

  const handleAdd = async () => {
    if (!form.nome || !form.preco) return;
    await addSKU({ nome: form.nome, descricao: form.descricao || null, tipo: form.tipo, preco: parseFloat(form.preco), recorrencia: form.recorrencia, capacidade: form.capacidade ? parseInt(form.capacidade) : null, modulos_liberados: form.modulos_liberados ? form.modulos_liberados.split(',').map(m => m.trim()) : [], ativo: form.ativo, entregas: [], beneficios: [], plano_id: null });
    resetForm(); setIsAddOpen(false);
  };

  const handleDelete = async () => { if (deletingId) { await deleteSKU(deletingId); setDeletingId(null); } };
  const handleToggle = async (sku: SKU) => { await updateSKU(sku.id, { ativo: !sku.ativo } as any); };

  const ativos = skus.filter(s => s.ativo).length;
  const receitaPotencial = skus.filter(s => s.ativo).reduce((sum, s) => sum + s.preco, 0);
  const tipos = new Set(skus.map(s => s.tipo)).size;

  const shellMetrics = [
    { label: 'TOTAL SKUS', value: String(skus.length) },
    { label: 'ATIVOS', value: String(ativos), color: 'text-[hsl(var(--urgency-opportunity))]' },
    { label: 'TIPOS', value: String(tipos) },
    { label: 'RECEITA POT.', value: `R$ ${receitaPotencial.toLocaleString('pt-BR')}` },
  ];

  if (loading) {
    return <PageShell title="CATÁLOGO (SKUs)" sub="Carregando..."><div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded" />)}</div></PageShell>;
  }

  return (
    <PageShell
      title="CATÁLOGO (SKUs)"
      sub={`${ativos} produtos ativos`}
      metrics={shellMetrics}
      actions={<button onClick={() => setIsAddOpen(true)} className="px-2 py-1 text-[10px] font-mono rounded border border-white/20 text-white/60 hover:text-white transition-colors">+ NOVO SKU</button>}
    >
      {skus.length === 0 ? (
        <Card><CardContent className="py-12 text-center space-y-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">Nenhum SKU cadastrado</p>
          <Button onClick={() => setIsAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo SKU</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {skus.map(sku => (
            <Card key={sku.id} className={cn('transition-all', !sku.ativo && 'opacity-50')}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div><p className="font-medium text-sm">{sku.nome}</p>{sku.descricao && <p className="text-xs text-muted-foreground mt-0.5">{sku.descricao}</p>}</div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(sku)}><Layers className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(sku.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[9px] font-mono">{TIPO_LABELS[sku.tipo] || sku.tipo}</Badge>
                  <Badge variant="outline" className="text-[9px] font-mono"><Repeat className="h-2.5 w-2.5 mr-0.5" />{RECORRENCIA_LABELS[sku.recorrencia] || sku.recorrencia}</Badge>
                  {!sku.ativo && <Badge variant="secondary" className="text-[9px]">Inativo</Badge>}
                </div>
                <div className="text-lg font-bold font-mono">R$ {sku.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                {sku.capacidade && <p className="text-[10px] text-muted-foreground font-mono">Cap: {sku.capacidade}</p>}
                {sku.modulos_liberados && sku.modulos_liberados.length > 0 && (
                  <div className="flex flex-wrap gap-1">{sku.modulos_liberados.map(m => <Badge key={m} variant="secondary" className="text-[8px]">{m}</Badge>)}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Adicionar SKU</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo</Label><Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Recorrência</Label><Select value={form.recorrencia} onValueChange={v => setForm(f => ({ ...f, recorrencia: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(RECORRENCIA_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Preço (R$) *</Label><Input type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} /></div>
              <div><Label>Capacidade</Label><Input type="number" value={form.capacidade} onChange={e => setForm(f => ({ ...f, capacidade: e.target.value }))} placeholder="Ilimitado" /></div>
            </div>
            <div><Label>Módulos</Label><Input value={form.modulos_liberados} onChange={e => setForm(f => ({ ...f, modulos_liberados: e.target.value }))} placeholder="Separados por vírgula" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} /><Label>Ativo</Label></div>
            <Button className="w-full" onClick={handleAdd}>Adicionar SKU</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)} title="Remover SKU" description="Remover este SKU? Ação irreversível." onConfirm={handleDelete} />
    </PageShell>
  );
}
