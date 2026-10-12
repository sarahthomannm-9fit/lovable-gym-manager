import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Sku = { id: string; nome: string; preco: number; tipo: string; capacidade: number | null; ativo: boolean };
type Student = { id: string; nome: string };
type Order = { id: string; aluno_id: string; sku_id: string; quantity: number; total: number; status: string; payment_id: string; fulfillment_reference: string | null; created_at: string };
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function StoreDashboard() {
  const { activeOrg } = useOperationalContext();
  const [skus, setSkus] = useState<Sku[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ aluno_id: '', sku_id: '', quantity: 1, request_id: crypto.randomUUID() });
  const load = useCallback(async () => {
    setLoading(true);
    const [catalog, people, purchases] = await Promise.all([
      supabase.from('skus').select('id,nome,preco,tipo,capacidade,ativo').eq('ativo', true).order('nome'),
      activeOrg?.id ? supabase.from('alunos').select('id,nome').eq('organization_id', activeOrg.id).order('nome') : Promise.resolve({ data: [], error: null }),
      activeOrg?.id ? supabase.from('store_orders' as any).select('id,aluno_id,sku_id,quantity,total,status,payment_id,fulfillment_reference,created_at').eq('organization_id', activeOrg.id).order('created_at', { ascending: false }).limit(300) : Promise.resolve({ data: [], error: null }),
    ]);
    const error = catalog.error || people.error || purchases.error;
    if (error) toast.error(error.message);
    else { setSkus((catalog.data || []) as unknown as Sku[]); setStudents((people.data || []) as Student[]); setOrders((purchases.data || []) as unknown as Order[]); }
    setLoading(false);
  }, [activeOrg?.id]);
  useEffect(() => { load(); }, [load]);
  const place = async () => {
    if (!activeOrg?.id || !form.aluno_id || !form.sku_id) { toast.error('Selecione organização, aluno e SKU.'); return; }
    setSaving(true);
    const { error } = await supabase.rpc('place_store_order' as any, { p_organization_id: activeOrg.id, p_aluno_id: form.aluno_id, p_sku_id: form.sku_id, p_quantity: form.quantity, p_request_id: form.request_id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Pedido criado. Aguarda baixa de pagamento; nenhum acesso foi liberado antecipadamente.');
    setForm({ aluno_id: '', sku_id: '', quantity: 1, request_id: crypto.randomUUID() }); await load();
  };
  const fulfill = async (id: string) => {
    const reference = window.prompt('Informe a referência da entrega');
    if (!reference) return;
    const { error } = await supabase.rpc('fulfill_store_order' as any, { p_order_id: id, p_reference: reference });
    if (error) { toast.error(error.message); return; }
    toast.success('Entrega registrada.'); await load();
  };
  const paid = orders.filter((row) => row.status === 'pago' || row.status === 'entregue');
  return <div className="space-y-6 p-6">
    <div><h1 className="font-display text-3xl">Store</h1><p className="text-sm text-muted-foreground">Pedidos reais, baixa manual em Pagamentos e liberação de acesso após pagamento.</p></div>
    {!activeOrg && <p className="text-sm text-muted-foreground">Selecione uma organização para criar pedidos.</p>}
    <div className="grid gap-4 md:grid-cols-3">{([['SKUs ativos', skus.length], ['Pedidos pagos', paid.length], ['Receita registrada', money(paid.reduce((sum, row) => sum + Number(row.total), 0))]] as const).map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{value}</CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Novo pedido</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_100px_auto]"><div><Label>Aluno</Label><Select value={form.aluno_id} onValueChange={(value) => setForm({ ...form, aluno_id: value })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{students.map((row) => <SelectItem key={row.id} value={row.id}>{row.nome}</SelectItem>)}</SelectContent></Select></div><div><Label>SKU</Label><Select value={form.sku_id} onValueChange={(value) => setForm({ ...form, sku_id: value })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{skus.map((row) => <SelectItem key={row.id} value={row.id}>{row.nome} · {money(Number(row.preco))}</SelectItem>)}</SelectContent></Select></div><div><Label>Quantidade</Label><Input type="number" min="1" max="100" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></div><Button className="self-end" onClick={place} disabled={saving || !activeOrg}>Criar pedido</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Pedidos</CardTitle></CardHeader><CardContent className="space-y-2">{loading ? <p>Carregando…</p> : orders.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pedido nesta organização.</p> : orders.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 py-3"><div><p className="font-medium">{skus.find((sku) => sku.id === row.sku_id)?.nome || 'SKU'} · {students.find((student) => student.id === row.aluno_id)?.nome || 'Aluno'}</p><p className="text-sm text-muted-foreground">{row.quantity} unidade(s) · {money(Number(row.total))} · pagamento {row.payment_id.slice(0, 8)}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{row.status.replace(/_/g, ' ')}</Badge>{row.status === 'pago' && <Button size="sm" onClick={() => fulfill(row.id)}>Registrar entrega</Button>}</div></div>)}</CardContent></Card>
  </div>;
}

