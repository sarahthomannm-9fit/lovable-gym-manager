import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  KpiCard, SectionHeader, DashboardSkeleton, DashboardError, DashboardEmpty,
} from '@/components/dashboard/DashboardKit';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileText, Download, RefreshCw, Sparkles, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

type Report = {
  id: string; agent_id: string; report_date: string; summary: string;
  metrics: any; highlights: any; created_at: string;
};

const PERIODOS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'all', label: 'Todo o histórico' },
];

export default function RelatoriosAutomaticos() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agente, setAgente] = useState('todos');
  const [periodo, setPeriodo] = useState('30');
  const [gerando, setGerando] = useState(false);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase.from('agent_reports')
        .select('id, agent_id, report_date, summary, metrics, highlights, created_at')
        .order('report_date', { ascending: false }).limit(200);
      if (periodo !== 'all') {
        const desde = new Date(Date.now() - Number(periodo) * 86400000).toISOString().slice(0, 10);
        q = q.gte('report_date', desde);
      }
      if (agente !== 'todos') q = q.eq('agent_id', agente);
      const { data, error: err } = await q;
      if (err) throw err;
      setReports((data || []) as Report[]);
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, [agente, periodo]);

  const [agentes, setAgentes] = useState<string[]>([]);
  useEffect(() => {
    supabase.from('agent_reports').select('agent_id').limit(500).then(({ data }) => {
      setAgentes([...new Set((data || []).map((d: any) => d.agent_id))].sort());
    });
  }, []);

  const totais = useMemo(() => ({
    total: reports.length,
    agentes: new Set(reports.map((r) => r.agent_id)).size,
    ultimo: reports[0]?.report_date || '—',
  }), [reports]);

  const gerar = async () => {
    setGerando(true);
    const { error: err } = await supabase.functions.invoke('agent-hub-chat', {
      body: { agentId: agente === 'todos' ? 'ceo' : agente, mode: 'report' },
    });
    setGerando(false);
    if (err) return toast.error('Não foi possível gerar agora. Tente novamente.');
    toast.success('Relatório solicitado — atualizando histórico');
    carregar();
  };

  const baixarCSV = () => {
    const rows = [
      ['Data', 'Agente', 'Resumo'],
      ...reports.map((r) => [r.report_date, r.agent_id, (r.summary || '').replace(/\s+/g, ' ')]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorios-automaticos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download iniciado');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-display">Relatórios automáticos</h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico gerado pelos agentes do Centro de Inteligência 9FIT</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={agente} onValueChange={setAgente}>
            <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-xs">Todos os agentes</SelectItem>
              {agentes.map((a) => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button size="sm" onClick={gerar} disabled={gerando}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> {gerando ? 'Gerando…' : 'Gerar relatório'}
          </Button>
          <Button variant="outline" size="sm" onClick={baixarCSV} disabled={!reports.length}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
          </Button>
        </div>
      </header>

      {loading ? (
        <DashboardSkeleton cards={3} />
      ) : error ? (
        <DashboardError message={error} onRetry={carregar} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <KpiCard label="Relatórios no período" value={totais.total} icon={FileText} />
            <KpiCard label="Agentes ativos" value={totais.agentes} icon={Sparkles} />
            <KpiCard label="Último relatório" value={totais.ultimo} icon={CalendarDays} />
          </div>

          <section>
            <SectionHeader title="Histórico" description="Resumo executivo por agente e data" />
            {reports.length === 0 ? (
              <DashboardEmpty
                title="Nenhum relatório no período"
                message="Gere um relatório agora ou amplie o intervalo de datas."
                actionLabel="Gerar relatório"
                onAction={gerar}
              />
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <Card key={r.id} className="bg-card/60 border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] uppercase">{r.agent_id}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.report_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{r.summary}</p>
                      {Array.isArray(r.highlights) && r.highlights.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {r.highlights.slice(0, 5).map((h: any, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground">• {typeof h === 'string' ? h : JSON.stringify(h)}</li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
