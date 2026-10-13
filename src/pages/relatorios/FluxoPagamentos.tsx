import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Expense = {
  id: string; categoria: string; fornecedor: string | null; descricao: string; valor: number;
  data_vencimento: string; data_pagamento: string | null; status: string; comprovante_url: string | null;
};
const moeda = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FluxoPagamentos() {
  const { activeOrg, isAdmin } = useOperationalContext();
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ categoria: '', fornecedor: '', descricao: '', valor: '', data_vencimento: '' });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (!activeOrg && !isAdmin) throw new Error('Selecione uma organização.');
      let query = (supabase as any).from('expense_ledger').select('id,categoria,fornecedor,descricao,valor,data_vencimento,data_pagamento,status,comprovante_url').order('data_vencimento', { ascending: false });
      if (activeOrg) query = query.eq('organization_id', activeOrg.id);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setRows(data || []);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha ao carregar despesas.';
      setError(message); setRows([]); toast.error(message);
    } finally { setLoading(false); }
  }, [activeOrg?.id, isAdmin]);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => ({
    abertas: rows.filter((row) => row.status === 'rascunho' || row.status === 'aprovada').reduce((sum, row) => sum + Number(row.valor), 0),
    pagas: rows.filter((row) => row.status === 'paga').reduce((sum, row) => sum + Number(row.valor), 0),
  }), [rows]);

  const create = async () => {
    if (!activeOrg) return toast.error('Selecione a organização.');
    if (!form.categoria.trim() || !form.descricao.trim() || !form.data_vencimento || !(Number(form.valor) > 0)) return toast.error('Preencha categoria, descrição, valor e vencimento.');
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setSaving(false); return toast.error('Faça login novamente.'); }
    const { error: insertError } = await (supabase as any).from('expense_ledger').insert({ organization_id: activeOrg.id, categoria: form.categoria.trim(), fornecedor: form.fornecedor.trim() || null, descricao: form.descricao.trim(), valor: Number(form.valor), data_vencimento: form.data_vencimento, tipo: 'variavel', recorrente: false, created_by: userData.user.id });
    setSaving(false);
    if (insertError) return toast.error(insertError.message);
    setForm({ categoria: '', fornecedor: '', descricao: '', valor: '', data_vencimento: '' });
    toast.success('Despesa salva como rascunho.'); load();
  };
  const transition = async (id: string, action: 'approve' | 'pay' | 'cancel') => {
    const proof = action === 'pay' ? window.prompt('URL HTTPS do comprovante da baixa manual:') : null;
    if (action === 'pay' && !proof) return;
    const { error: actionError } = await (supabase as any).rpc('transition_expense', { p_id: id, p_action: action, p_proof_url: proof });
    if (actionError) return toast.error(actionError.message);
    toast.success(action === 'pay' ? 'Baixa manual registrada.' : action === 'approve' ? 'Despesa aprovada.' : 'Despesa cancelada.'); load();
  };

  return <div className="space-y-6 p-6"><div><h1 className="font-display text-3xl">Fluxo de pagamentos</h1><p className="text-sm text-muted-foreground">Despesas da organização, aprovação e baixa manual com comprovante.</p></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle className="text-sm">Em aberto</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{moeda(totals.abertas)}</CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Baixadas manualmente</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{moeda(totals.pagas)}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Nova despesa</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><div><Label>Categoria</Label><Input value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })} /></div><div><Label>Fornecedor</Label><Input value={form.fornecedor} onChange={(event) => setForm({ ...form, fornecedor: event.target.value })} /></div><div><Label>Valor</Label><Input type="number" min="0.01" step="0.01" value={form.valor} onChange={(event) => setForm({ ...form, valor: event.target.value })} /></div><div><Label>Vencimento</Label><Input type="date" value={form.data_vencimento} onChange={(event) => setForm({ ...form, data_vencimento: event.target.value })} /></div><div className="md:col-span-2"><Label>Descrição</Label><Input value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} /></div><Button disabled={saving || !activeOrg} onClick={create}>Salvar rascunho</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Lançamentos</CardTitle></CardHeader><CardContent className="space-y-2">{loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma despesa registrada neste contexto.</p> : rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 py-3 text-sm"><div><p className="font-medium">{row.categoria} · {row.descricao}</p><p className="text-muted-foreground">{row.fornecedor || 'Sem fornecedor'} · vencimento {row.data_vencimento}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{row.status}</Badge><strong>{moeda(Number(row.valor))}</strong>{row.status === 'rascunho' && <Button size="sm" onClick={() => transition(row.id, 'approve')}>Aprovar</Button>}{row.status === 'aprovada' && <Button size="sm" onClick={() => transition(row.id, 'pay')}>Registrar baixa</Button>}{['rascunho','aprovada'].includes(row.status) && <Button size="sm" variant="ghost" onClick={() => transition(row.id, 'cancel')}>Cancelar</Button>}{row.comprovante_url && <a className="text-primary underline" href={row.comprovante_url} target="_blank" rel="noreferrer">Comprovante</a>}</div></div>)}</CardContent></Card>
  </div>;
}

