import { useEffect, useState } from 'react';
import { PersonaLayout, PersonaEmptyState } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, TrendingUp, Activity, Download, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';

const ACCENT = '#A78BFA';

export default function CorpHome() {
  const { activeOrg, ensureOrgForPersona } = useOperationalContext();
  const [ready, setReady] = useState(false);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [engajamento, setEngajamento] = useState<Record<string, number>>({});
  const [faturamento, setFaturamento] = useState<{ mes: string; total: number }[]>([]);

  useEffect(() => { ensureOrgForPersona('corporate').then(() => setReady(true)); }, []);

  useEffect(() => {
    if (!activeOrg) return;
    (async () => {
      const { data } = await supabase.from('alunos')
        .select('id, nome, status, data_matricula, valor_mensalidade')
        .eq('organization_id', activeOrg.id).order('nome');
      setAlunos(data || []);

      const ids = (data || []).map(a => a.id);
      if (ids.length) {
        const trintaAtras = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const { data: chs } = await supabase.from('checkins')
          .select('aluno_id').in('aluno_id', ids).gte('data_checkin', trintaAtras);
        const counts: Record<string, number> = {};
        (chs || []).forEach((c: any) => { counts[c.aluno_id] = (counts[c.aluno_id] || 0) + 1; });
        setEngajamento(counts);

        const seisMeses = new Date();
        seisMeses.setMonth(seisMeses.getMonth() - 5);
        const inicio = new Date(seisMeses.getFullYear(), seisMeses.getMonth(), 1).toISOString().slice(0, 10);
        const { data: pgs } = await supabase.from('pagamentos')
          .select('valor, data_pagamento').in('aluno_id', ids).eq('status', 'pago')
          .gte('data_pagamento', inicio);
        const buckets: Record<string, number> = {};
        (pgs || []).forEach((p: any) => {
          const k = (p.data_pagamento || '').slice(0, 7);
          buckets[k] = (buckets[k] || 0) + Number(p.valor || 0);
        });
        setFaturamento(Object.entries(buckets).sort().map(([mes, total]) => ({ mes, total })));
      }
    })();
  }, [activeOrg]);

  const ativos = alunos.filter(a => a.status === 'ativo').length;
  const adesao = alunos.length ? Math.round(ativos / alunos.length * 100) : 0;
  const ativosEngajados = Object.values(engajamento).filter(n => n >= 4).length;
  const totalFat = faturamento.reduce((s, f) => s + f.total, 0);

  const exportarCSV = () => {
    if (!alunos.length) return toast.error('Nada a exportar');
    const header = 'Nome,Status,Desde,Mensalidade,Presencas30d\n';
    const rows = alunos.map(a => `"${a.nome}","${a.status}","${a.data_matricula || ''}","${a.valor_mensalidade || 0}","${engajamento[a.id] || 0}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeOrg?.nome || 'corp'}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  const solicitarRelatorio = async () => {
    const { error } = await supabase.from('support_tickets').insert({
      message: `[${activeOrg?.nome}] Solicito relatório executivo completo (PDF) do período atual.`,
      category: 'corporate',
    });
    if (error) toast.error('Falha'); else toast.success('Relatório solicitado à equipe 9FIT');
  };

  return (
    <PersonaLayout title="Painel Corporativo" subtitle="Relatório executivo" accent={ACCENT}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KPI icon={Users} label="Elegíveis" value={alunos.length} accent={ACCENT} />
        <KPI icon={Activity} label="Ativos" value={ativos} accent={ACCENT} />
        <KPI icon={TrendingUp} label="Adesão" value={`${adesao}%`} accent={ACCENT} />
        <KPI icon={DollarSign} label="Faturado (6m)" value={`R$ ${(totalFat/1000).toFixed(1)}k`} accent={ACCENT} />
      </div>

      <Tabs defaultValue="resumo">
        <TabsList className="mb-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="engajamento">Engajamento</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5 space-y-3">
              <p className="text-sm">
                <strong>{ativosEngajados}</strong> de <strong>{ativos}</strong> ativos engajados (≥4 presenças no mês).
              </p>
              <p className="text-sm text-muted-foreground">
                Taxa de engajamento: {ativos ? Math.round(ativosEngajados / ativos * 100) : 0}%
              </p>
              <div className="flex gap-2 pt-2">
                <Button onClick={exportarCSV} variant="outline" size="sm"
                        className="border-[#A78BFA]/40 text-[#A78BFA] hover:bg-[#A78BFA]/10">
                  <Download className="w-4 h-4 mr-1" /> Exportar CSV
                </Button>
                <Button onClick={solicitarRelatorio} size="sm"
                        style={{ backgroundColor: ACCENT, color: '#000' }}>
                  <FileText className="w-4 h-4 mr-1" /> Solicitar relatório completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funcionarios">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead>Desde</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {alunos.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{a.nome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{a.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.data_matricula}</TableCell>
                    </TableRow>
                  ))}
                  {!alunos.length && <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">Nenhum vinculado.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engajamento">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Funcionário</TableHead><TableHead className="text-right">Presenças (30d)</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {alunos.map(a => {
                    const n = engajamento[a.id] || 0;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>{a.nome}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={
                            n >= 8 ? 'border-emerald-500/40 text-emerald-400' :
                            n >= 4 ? 'border-blue-500/40 text-blue-400' :
                            'border-amber-500/40 text-amber-400'
                          }>{n}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faturamento">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5">
              {faturamento.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
                <ul className="space-y-2">
                  {faturamento.map(f => (
                    <li key={f.mes} className="flex items-center justify-between">
                      <span className="text-sm">{f.mes}</span>
                      <span className="font-semibold">R$ {f.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PersonaLayout>
  );
}

function KPI({ icon: Icon, label, value, accent }: any) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
             style={{ backgroundColor: `${accent}1A`, color: accent }}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
