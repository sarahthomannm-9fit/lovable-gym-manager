import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CommonAreaOperations({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(''); setRows([]);
    const { data, error } = await supabase.from('area_reservations').select('*').eq('organization_id', orgId).order('starts_at', { ascending: false });
    if (error) setError(error.message); else setRows(data || []);
    setLoading(false);
  }, [orgId]);
  useEffect(() => { void load(); }, [load]);
  const act = async (id: string, complete: boolean) => {
    if (busy || !window.confirm(complete ? 'Registrar a utilização desta reserva?' : 'Cancelar esta reserva?')) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc(complete ? 'complete_area_reservation' : 'cancel_area_reservation', { p_id: id });
    if (error) toast.error(error.message); else { toast.success('Reserva atualizada.'); await load(); }
    setBusy(false);
  };
  return <Card><CardHeader><CardTitle>Reservas das áreas comuns</CardTitle></CardHeader><CardContent className="space-y-3">
    {loading ? <p role="status">Carregando…</p> : error ? <div role="alert">{error}<Button onClick={load}>Tentar novamente</Button></div> : !rows.length ? <p>Nenhuma reserva cadastrada.</p> : rows.map(row => <div key={row.id} className="rounded border p-4 space-y-2">
      <strong>{row.title}</strong><p>{row.area_type} · {row.status}</p>
      <p>{new Date(row.starts_at).toLocaleString('pt-BR')} até {new Date(row.ends_at).toLocaleString('pt-BR')}</p>
      {row.status === 'confirmada' && <div className="flex gap-2">{new Date(row.starts_at) > new Date() && <Button disabled={busy} variant="outline" onClick={() => act(row.id, false)}>Cancelar reserva</Button>}{new Date(row.ends_at) <= new Date() && <Button disabled={busy} onClick={() => act(row.id, true)}>Registrar utilização</Button>}</div>}
    </div>)}
  </CardContent></Card>;
}
