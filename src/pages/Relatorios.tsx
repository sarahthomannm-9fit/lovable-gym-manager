import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Student = { id: string; nome: string; valor_mensalidade: number | null; lifecycle_status: string | null };
type Payment = { id: string; aluno_id: string | null; valor: number; status: string | null; data_vencimento: string; data_pagamento: string | null };
type Expense = { id: string; valor: number; status: string; data_vencimento: string; data_pagamento: string | null };
const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const localDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function Relatorios() {
  const { activeOrg } = useOperationalContext();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(() => localDay().slice(0, 7));

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (!activeOrg?.id) { setStudents([]); setPayments([]); setExpenses([]); return; }
      const [studentResult, expenseResult] = await Promise.all([
        supabase.from('alunos').select('id,nome,valor_mensalidade,lifecycle_status').eq('organization_id', activeOrg.id),
        supabase.from('expense_ledger' as any).select('id,valor,status,data_vencimento,data_pagamento').eq('organization_id', activeOrg.id).gte('data_vencimento', `${period}-01`).lt('data_vencimento', nextMonth(period)),
      ]);
      if (studentResult.error) throw studentResult.error;
      if (expenseResult.error) throw expenseResult.error;
      const people = (studentResult.data || []) as Student[];
      const ids = people.map((row) => row.id);
      const received: Payment[] = [];
      for (let start = 0; start < ids.length; start += 100) {
        const group = ids.slice(start, start + 100);
        for (let offset = 0; ; offset += 500) {
          const page = await supabase.from('pagamentos').select('id,aluno_id,valor,status,data_vencimento,data_pagamento').in('aluno_id', group).gte('data_vencimento', `${period}-01`).lt('data_vencimento', nextMonth(period)).range(offset, offset + 499);
          if (page.error) throw page.error;
          received.push(...((page.data || []) as Payment[]));
          if (!page.data || page.data.length < 500) break;
        }
      }
      setStudents(people); setPayments(received); setExpenses((expenseResult.data || []) as unknown as Expense[]);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha no relatório financeiro.';
      setError(message); setStudents([]); setPayments([]); setExpenses([]); toast.error(message);
    } finally { setLoading(false); }
  }, [activeOrg?.id, period]);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const paid = payments.filter((row) => row.status === 'pago').reduce((sum, row) => sum + Number(row.valor), 0);
    const pending = payments.filter((row) => row.status !== 'pago' && row.status !== 'cancelado').reduce((sum, row) => sum + Number(row.valor), 0);
    const overdue = payments.filter((row) => row.status !== 'pago' && row.status !== 'cancelado' && row.data_vencimento < localDay()).reduce((sum, row) => sum + Number(row.valor), 0);
    const spent = expenses.filter((row) => row.status === 'paga').reduce((sum, row) => sum + Number(row.valor), 0);
    const mrr = students.filter((row) => row.lifecycle_status === 'ativo').reduce((sum, row) => sum + Number(row.valor_mensalidade || 0), 0);
    return { paid, pending, overdue, spent, mrr, balance: paid - spent };
  }, [payments, expenses, students]);
  return <div className="space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-3xl">Dashboard financeiro</h1><p className="text-sm text-muted-foreground">Lançamentos do mês de competência e da organização selecionada. Baixas manuais são exibidas como registradas, não como conciliação bancária.</p></div><div className="flex items-center gap-2"><input aria-label="Mês" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded border bg-background px-3 py-2 text-sm" /><Button variant="outline" onClick={load} disabled={loading}>Atualizar</Button></div></div>
    {!activeOrg && <p className="text-sm text-muted-foreground">Selecione uma organização para consultar o financeiro.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{([['Recebido', totals.paid], ['Em aberto', totals.pending], ['Vencido', totals.overdue], ['Despesas pagas', totals.spent], ['Saldo registrado', totals.balance], ['MRR contratado', totals.mrr]] as const).map(([name, value]) => <Card key={name}><CardHeader><CardTitle className="text-sm">{name}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{currency(value)}</CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Rastreio dos recebíveis</CardTitle></CardHeader><CardContent className="space-y-2">{loading ? <p>Carregando…</p> : payments.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum lançamento neste mês.</p> : payments.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2 text-sm"><div><p className="font-medium">{students.find((student) => student.id === row.aluno_id)?.nome || 'Aluno'}</p><p className="text-muted-foreground">Vence {row.data_vencimento}{row.data_pagamento ? ` · baixa ${row.data_pagamento}` : ''}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{row.status || 'pendente'}</Badge><strong>{currency(Number(row.valor))}</strong></div></div>)}</CardContent></Card>
  </div>;
}

function nextMonth(month: string) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 10);
}

