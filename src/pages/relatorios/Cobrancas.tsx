import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

type Student = { id: string; nome: string; user_id: string | null };
type Charge = { id: string; aluno_id: string; pagamento_id: string; titulo: string; descricao: string | null; status: string };
type Payment = { id: string; valor: number; data_vencimento: string; status: string | null };
const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Cobrancas() {
  const { activeOrg } = useOperationalContext();
  const [students, setStudents] = useState<Student[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ aluno_id: '', titulo: '', descricao: '', valor: '', due: '' });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!activeOrg?.id) { setStudents([]); setCharges([]); setPayments({}); return; }
      const [a, b] = await Promise.all([
        supabase.from('alunos').select('id,nome,user_id').eq('organization_id', activeOrg.id).order('nome'),
        supabase.from('billing_charges' as any).select('id,aluno_id,pagamento_id,titulo,descricao,status').eq('organization_id', activeOrg.id).order('created_at', { ascending: false }).limit(500),
      ]);
      if (a.error) throw a.error; if (b.error) throw b.error;
      const found = (b.data || []) as unknown as Charge[];
      const ids = found.map((row) => row.pagamento_id);
      let related: Payment[] = [];
      if (ids.length) { const r = await supabase.from('pagamentos').select('id,valor,data_vencimento,status').in('id', ids); if (r.error) throw r.error; related = (r.data || []) as Payment[]; }
      setStudents((a.data || []) as Student[]); setCharges(found); setPayments(Object.fromEntries(related.map((row) => [row.id, row])));
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao carregar cobranças.'); }
    finally { setLoading(false); }
  }, [activeOrg?.id]);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    if (!activeOrg?.id || !form.aluno_id || !form.titulo.trim() || !form.due || Number(form.valor) <= 0) { toast.error('Preencha aluno, título, valor e vencimento.'); return; }
    setSaving(true);
    const { error } = await supabase.rpc('create_billing_charge' as any, { p_organization_id: activeOrg.id, p_aluno_id: form.aluno_id, p_titulo: form.titulo.trim(), p_descricao: form.descricao.trim(), p_valor: Number(form.valor), p_due: form.due });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Cobrança registrada.'); setOpen(false); setForm({ aluno_id: '', titulo: '', descricao: '', valor: '', due: '' }); await load();
  };
  const send = async (id: string) => {
    const { error } = await supabase.rpc('send_billing_charge' as any, { p_charge_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success('Aviso enviado pelo aplicativo.'); await load();
  };
  const openRows = charges.filter((row) => payments[row.pagamento_id]?.status !== 'pago');
  const due = openRows.reduce((sum, row) => sum + Number(payments[row.pagamento_id]?.valor || 0), 0);
  return <div className="space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-3xl">Cobranças</h1><p className="text-sm text-muted-foreground">Lançamentos financeiros e avisos no aplicativo por organização.</p></div><div className="flex gap-2"><Button variant="outline" onClick={load} disabled={loading}>Atualizar</Button><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button disabled={!activeOrg}>Nova cobrança</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nova cobrança individual</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Aluno</Label><Select value={form.aluno_id} onValueChange={(v) => setForm({ ...form, aluno_id: v })}><SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger><SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}{!s.user_id ? ' · sem acesso ao app' : ''}</SelectItem>)}</SelectContent></Select></div><div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div><div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><Label>Valor (R$)</Label><Input type="number" min="0.01" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div><div><Label>Vencimento</Label><Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></div></div><Button onClick={create} disabled={saving} className="w-full">{saving ? 'Salvando…' : 'Criar cobrança'}</Button></div></DialogContent></Dialog></div></div>
    {!activeOrg && <p className="text-sm text-muted-foreground">Selecione uma organização para gerenciar cobranças.</p>}
    <div className="grid gap-4 md:grid-cols-3">{([['Em aberto', money(due)], ['Avisos no app', charges.filter((c) => c.status === 'enviada').length], ['Vencidas', openRows.filter((c) => payments[c.pagamento_id]?.data_vencimento < new Date().toISOString().slice(0, 10)).length]] as const).map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{value}</CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Cobranças registradas</CardTitle></CardHeader><CardContent className="space-y-2">{loading ? <p>Carregando…</p> : charges.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma cobrança nesta organização.</p> : charges.map((row) => { const pay = payments[row.pagamento_id]; return <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 py-3"><div><p className="font-medium">{row.titulo} · {students.find((s) => s.id === row.aluno_id)?.nome || 'Aluno'}</p><p className="text-sm text-muted-foreground">{row.descricao || 'Sem descrição'} · vencimento {pay?.data_vencimento || '—'}</p></div><div className="flex items-center gap-2"><strong>{money(Number(pay?.valor || 0))}</strong><Badge variant="outline">{pay?.status === 'pago' ? 'Pago' : row.status === 'enviada' ? 'Avisado no app' : 'Rascunho'}</Badge>{row.status === 'rascunho' && pay?.status !== 'pago' && <Button size="sm" onClick={() => send(row.id)}>Enviar no app</Button>}</div></div>; })}</CardContent></Card>
  </div>;
}

