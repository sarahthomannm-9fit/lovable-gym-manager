import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { OperationalDeliveryBoard } from '@/components/OperationalDeliveryBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Student = { id: string; nome: string; lifecycle_status: string | null; valor_mensalidade: number | null };
type Payment = { id: string; aluno_id: string | null; valor: number; status: string | null; data_vencimento: string; data_pagamento: string | null };
const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const localDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function EstrategiasIA() {
  const { activeOrg } = useOperationalContext();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!activeOrg?.id) { setStudents([]); setPayments([]); return; }
    setLoading(true); setError('');
    try {
      const { data, error: studentError } = await supabase.from('alunos').select('id,nome,lifecycle_status,valor_mensalidade').eq('organization_id', activeOrg.id);
      if (studentError) throw studentError;
      const people = (data || []) as Student[];
      const ids = people.map((row) => row.id);
      const bills: Payment[] = [];
      for (let start = 0; start < ids.length; start += 100) {
        for (let offset = 0; ; offset += 500) {
          const page = await supabase.from('pagamentos').select('id,aluno_id,valor,status,data_vencimento,data_pagamento').in('aluno_id', ids.slice(start, start + 100)).range(offset, offset + 499);
          if (page.error) throw page.error;
          bills.push(...((page.data || []) as Payment[]));
          if (!page.data || page.data.length < 500) break;
        }
      }
      setStudents(people); setPayments(bills);
    } catch (cause) { const message = cause instanceof Error ? cause.message : 'Falha ao carregar dados financeiros.'; setError(message); toast.error(message); }
    finally { setLoading(false); }
  }, [activeOrg?.id]);
  useEffect(() => { load(); }, [load]);
  const indicators = useMemo(() => {
    const today = localDay();
    const overdue = payments.filter((row) => row.status !== 'pago' && row.status !== 'cancelado' && row.data_vencimento < today);
    const active = students.filter((row) => row.lifecycle_status === 'ativo');
    const paid = payments.filter((row) => row.status === 'pago');
    return { overdueCount: overdue.length, overdueValue: overdue.reduce((sum, row) => sum + Number(row.valor), 0), mrr: active.reduce((sum, row) => sum + Number(row.valor_mensalidade || 0), 0), active: active.length, received: paid.reduce((sum, row) => sum + Number(row.valor), 0), avgTicket: paid.length ? paid.reduce((sum, row) => sum + Number(row.valor), 0) / paid.length : 0 };
  }, [students, payments]);
  const proposals = [
    indicators.overdueCount > 0 ? { title: 'Revisar cobrança vencida', basis: `${indicators.overdueCount} lançamento(s), ${money(indicators.overdueValue)} em aberto.`, route: '/relatorios/cobrancas' } : null,
    indicators.active > 0 ? { title: 'Revisar oferta e ticket', basis: `MRR contratado ${money(indicators.mrr)}; ticket recebido médio ${money(indicators.avgTicket)}.`, route: '/catalogo' } : null,
  ].filter(Boolean) as { title: string; basis: string; route: string }[];
  return <div className="space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-3xl">Estratégias & IA</h1><p className="text-sm text-muted-foreground">Indicadores calculados de alunos e pagamentos reais. Sugestões são regras transparentes; execução exige registro e evidência.</p></div><Button variant="outline" onClick={load} disabled={loading}>Atualizar</Button></div>
    {!activeOrg && <p className="text-sm text-muted-foreground">Selecione uma organização.</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid gap-4 md:grid-cols-3">{([['MRR contratado', money(indicators.mrr)], ['Recebido registrado', money(indicators.received)], ['Vencido', money(indicators.overdueValue)]] as const).map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{value}</CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Oportunidades calculadas</CardTitle></CardHeader><CardContent className="space-y-3">{proposals.length === 0 ? <p className="text-sm text-muted-foreground">Sem proposta automática com os registros disponíveis.</p> : proposals.map((item) => <div key={item.title} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 py-2"><div><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.basis}</p></div><a href={item.route} className="text-sm text-primary underline">Abrir origem</a></div>)}</CardContent></Card>
    <OperationalDeliveryBoard moduleKey="finance_strategy" title="Decisões e resultados" />
  </div>;
}

