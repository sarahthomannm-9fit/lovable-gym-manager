import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Recebivel = {
  id: string; aluno_id: string | null; valor: number; data_vencimento: string;
  data_pagamento: string | null; status: string | null; metodo_pagamento: string | null; referencia_mes: string;
};
const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FluxoRecebimentos() {
  const { activeOrg, isAdmin } = useOperationalContext();
  const [rows, setRows] = useState<Recebivel[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      let studentQuery = supabase.from('alunos').select('id,nome');
      if (activeOrg) studentQuery = studentQuery.eq('organization_id', activeOrg.id);
      else if (!isAdmin) throw new Error('Selecione uma organização.');
      const { data: students, error: studentError } = await studentQuery;
      if (studentError) throw studentError;
      const ids = (students || []).map((student) => student.id);
      setNames(Object.fromEntries((students || []).map((student) => [student.id, student.nome])));
      if (!ids.length) { setRows([]); return; }
      const all: Recebivel[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error: paymentError } = await supabase.from('pagamentos')
          .select('id,aluno_id,valor,data_vencimento,data_pagamento,status,metodo_pagamento,referencia_mes')
          .in('aluno_id', ids).order('data_vencimento', { ascending: false }).range(offset, offset + 499);
        if (paymentError) throw paymentError;
        all.push(...((data || []) as Recebivel[]));
        if (!data || data.length < 500) break;
      }
      setRows(all);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha ao carregar recebimentos.';
      setError(message); setRows([]); toast.error(message);
    } finally { setLoading(false); }
  }, [activeOrg?.id, isAdmin]);
  useEffect(() => { load(); }, [load]);

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const totals = useMemo(() => ({
    recebido: rows.filter((row) => row.status === 'pago').reduce((sum, row) => sum + Number(row.valor), 0),
    vencido: rows.filter((row) => row.status !== 'pago' && row.data_vencimento < today).reduce((sum, row) => sum + Number(row.valor), 0),
    previsto: rows.filter((row) => row.status !== 'pago' && row.data_vencimento >= today).reduce((sum, row) => sum + Number(row.valor), 0),
  }), [rows, today]);

  return <div className="space-y-6 p-6">
    <div className="flex items-center justify-between gap-4"><div><h1 className="font-display text-3xl">Fluxo de recebimentos</h1><p className="text-sm text-muted-foreground">Valores registrados, previstos e vencidos na organização selecionada.</p></div><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid gap-4 md:grid-cols-3">
      {([['Recebido', totals.recebido], ['Previsto', totals.previsto], ['Vencido', totals.vencido]] as const).map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{moeda(value)}</CardContent></Card>)}
    </div>
    <Card><CardHeader><CardTitle>Lançamentos</CardTitle></CardHeader><CardContent className="space-y-2">
      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum recebível registrado neste contexto.</p> : rows.map((row) => {
        const state = row.status === 'pago' ? 'Recebido' : row.data_vencimento < today ? 'Vencido' : 'Previsto';
        return <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 py-3 text-sm"><div><p className="font-medium">{names[row.aluno_id || ''] || 'Aluno'} · competência {row.referencia_mes}</p><p className="text-muted-foreground">Vencimento {row.data_vencimento}{row.data_pagamento ? ` · pago em ${row.data_pagamento}` : ''}{row.metodo_pagamento ? ` · ${row.metodo_pagamento}` : ''}</p></div><div className="flex items-center gap-3"><Badge variant="outline">{state}</Badge><strong>{moeda(Number(row.valor))}</strong></div></div>;
      })}
    </CardContent></Card>
  </div>;
}

