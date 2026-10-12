import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Case = { id: string; title: string; description: string | null; status: string; due_on: string | null; outcome: string | null; evidence_url: string | null };
type Props = { moduleKey: 'operacao' | 'ceo' | 'consultoria' | 'concierge' | 'trust' | 'network' | 'automacao' | 'cfo'; title?: string };

export function OperationalDeliveryBoard({ moduleKey, title = 'Ações e entregas' }: Props) {
  const { activeOrg } = useOperationalContext();
  const [rows, setRows] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_on: '' });
  const [completion, setCompletion] = useState<Record<string, { detail: string; url: string }>>({});
  const load = useCallback(async () => {
    if (!activeOrg?.id) { setRows([]); return; }
    setLoading(true);
    const { data, error } = await supabase.from('operational_delivery_cases' as any).select('id,title,description,status,due_on,outcome,evidence_url').eq('organization_id', activeOrg.id).eq('module_key', moduleKey).order('created_at', { ascending: false }).limit(200);
    if (error) toast.error(error.message); else setRows((data || []) as unknown as Case[]);
    setLoading(false);
  }, [activeOrg?.id, moduleKey]);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    if (!activeOrg?.id || form.title.trim().length < 3) { toast.error('Selecione a organização e descreva a ação.'); return; }
    setSaving(true);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    const result = authError || !userData.user ? { error: authError || new Error('Autenticação necessária') } : await supabase.from('operational_delivery_cases' as any).insert({ organization_id: activeOrg.id, module_key: moduleKey, title: form.title.trim(), description: form.description.trim() || null, due_on: form.due_on || null, created_by: userData.user.id });
    setSaving(false);
    if (result.error) { toast.error(result.error.message); return; }
    setForm({ title: '', description: '', due_on: '' }); toast.success('Ação registrada.'); await load();
  };
  const transition = async (row: Case, status: 'em_andamento' | 'aguardando_aprovacao' | 'concluido' | 'cancelado') => {
    const input = completion[row.id] || { detail: '', url: '' };
    const { error } = await supabase.rpc('transition_operational_case' as any, { p_case_id: row.id, p_status: status, p_detail: input.detail || null, p_evidence_url: input.url || null });
    if (error) { toast.error(error.message); return; }
    toast.success('Estado atualizado.'); await load();
  };
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-4">
    {!activeOrg ? <p className="text-sm text-muted-foreground">Selecione uma organização para registrar entregas.</p> : <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]"><div><Label>Ação</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Descreva a entrega" /></div><div><Label>Prazo</Label><Input type="date" value={form.due_on} onChange={(e) => setForm({ ...form, due_on: e.target.value })} /></div><Button className="self-end" onClick={create} disabled={saving}>Criar ação</Button><Textarea className="md:col-span-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contexto, origem e responsável" /></div>}
    {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma ação registrada neste módulo.</p> : rows.map((row) => <div key={row.id} className="space-y-2 rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{row.title}</p><p className="text-xs text-muted-foreground">{row.description || 'Sem descrição'}{row.due_on ? ` · prazo ${row.due_on}` : ''}</p></div><Badge variant="outline">{row.status.replace(/_/g, ' ')}</Badge></div>{row.status === 'concluido' ? <p className="text-sm">{row.outcome} · <a className="text-primary underline" href={row.evidence_url || '#'} target="_blank" rel="noreferrer">Evidência</a></p> : row.status !== 'cancelado' && <div className="space-y-2"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => transition(row, 'em_andamento')}>Iniciar</Button><Button size="sm" variant="outline" onClick={() => transition(row, 'aguardando_aprovacao')}>Aguardar aprovação</Button><Button size="sm" variant="outline" onClick={() => transition(row, 'cancelado')}>Cancelar</Button></div><div className="grid gap-2 md:grid-cols-2"><Input value={completion[row.id]?.detail || ''} onChange={(e) => setCompletion({ ...completion, [row.id]: { ...(completion[row.id] || { detail: '', url: '' }), detail: e.target.value } })} placeholder="Resultado da entrega" /><Input value={completion[row.id]?.url || ''} onChange={(e) => setCompletion({ ...completion, [row.id]: { ...(completion[row.id] || { detail: '', url: '' }), url: e.target.value } })} placeholder="URL HTTPS da evidência" /></div><Button size="sm" onClick={() => transition(row, 'concluido')}>Concluir com evidência</Button></div>}</div>)}
  </CardContent></Card>;
}

