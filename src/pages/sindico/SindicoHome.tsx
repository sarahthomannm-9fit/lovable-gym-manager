import { useEffect, useState } from 'react';
import { PersonaLayout, PersonaEmptyState } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useOrgRole } from '@/hooks/useOrgRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Inbox, LifeBuoy, MessageSquarePlus, Megaphone, Eye, QrCode, Dumbbell, ClipboardCheck, ShieldAlert, HeartPulse } from 'lucide-react';
import { toast } from 'sonner';
import { usePersonaDashboard, type SindicoDashboard } from '@/hooks/usePersonaDashboard';
import { KpiCard, DashboardError } from '@/components/dashboard/DashboardKit';
import HealthDayQRGenerator from './HealthDayQRGenerator';


const ACCENT = '#60A5FA';

type Inad = { id: string; nome: string; valor: number; dias: number };
type Aula = { id: string; nome: string; horario_inicio: string; capacidade: number; inscritos: number; professor: string; data: string };
type Ticket = { id: string; message: string; status: string; created_at: string; agent_response: string | null };

export default function SindicoHome() {
  const { activeOrg, ensureOrgForPersona } = useOperationalContext();
  const { isComite, canSeeFinancials, canManageComunicados } = useOrgRole();
  const [ready, setReady] = useState(false);
  const [metrics, setMetrics] = useState({ alunos: 0, receita: 0, inadCount: 0, ocupacao: 0 });
  const [operacao, setOperacao] = useState({ unidades: 0, adesao: 0, checkinsMes: 0, treinosAtivos: 0, plantao: 'Mensal' });
  const [inad, setInad] = useState<Inad[]>([]);
  const [aulasHoje, setAulasHoje] = useState<Aula[]>([]);
  const [aulasSemana, setAulasSemana] = useState<Aula[]>([]);
  const [alunosLista, setAlunosLista] = useState<any[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [aviso, setAviso] = useState({ titulo: '', mensagem: '' });
  const [enviando, setEnviando] = useState(false);
  const [orgTemUnidadesEsperadas, setOrgTemUnidadesEsperadas] = useState(false);

  // Indicadores principais sempre pela RPC oficial
  const { data: dash, loading: dashLoading, error: dashError, refresh: refreshDash } =
    usePersonaDashboard<SindicoDashboard>('sindico', activeOrg?.id);

  const iniciais = (activeOrg?.nome || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    let mounted = true;
    setReady(false);
    ensureOrgForPersona('condominio').finally(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, [ensureOrgForPersona]);


  const carregar = async () => {
    if (!activeOrg) { setReady(true); return; }
    const hoje = new Date().toISOString().slice(0, 10);
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const seteDias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const { data: orgRow } = await supabase.from('organizations')
      .select('metadata')
      .eq('id', activeOrg.id)
      .maybeSingle();

    // Se o cadastro do condomínio já indica um número esperado de unidades/alunos,
    // isso ajuda a distinguir "condomínio novo, sem alunos mesmo" de "vínculo quebrado".
    const unidadesEsperadas = Number((orgRow?.metadata as any)?.total_unidades || (orgRow?.metadata as any)?.unidades || 0);
    setOrgTemUnidadesEsperadas(unidadesEsperadas > 0);

    const { data: alunosOrg } = await supabase.from('alunos')
      .select('id, nome, status, valor_mensalidade, data_matricula')
      .eq('organization_id', activeOrg.id).order('nome');
    const alunoIds = (alunosOrg || []).map(a => a.id);
    const alunoMap = Object.fromEntries((alunosOrg || []).map(a => [a.id, a.nome]));
    setAlunosLista(alunosOrg || []);
    const ativos = (alunosOrg || []).filter((a: any) => a.status === 'ativo').length;
    const unidades = Number((orgRow?.metadata as any)?.total_unidades || (orgRow?.metadata as any)?.unidades || Math.max(ativos, 100));

    let receita = 0;
    let inadList: Inad[] = [];
    if (alunoIds.length) {
      const { data: pagos } = await supabase.from('pagamentos').select('valor')
        .in('aluno_id', alunoIds).eq('status', 'pago').gte('data_pagamento', inicioMes);
      receita = (pagos || []).reduce((s, p: any) => s + Number(p.valor || 0), 0);

      const { data: atr } = await supabase.from('pagamentos')
        .select('id, aluno_id, valor, data_vencimento')
        .in('aluno_id', alunoIds).in('status', ['atrasado', 'pendente']).lt('data_vencimento', hoje)
        .order('data_vencimento').limit(20);
      inadList = (atr || []).map((p: any) => ({
        id: p.id, nome: alunoMap[p.aluno_id] || 'Aluno', valor: Number(p.valor),
        dias: Math.max(0, Math.floor((Date.now() - new Date(p.data_vencimento).getTime()) / 86400000)),
      }));

      const [{ count: checkinsMes }, { count: treinosAtivos }] = await Promise.all([
        supabase.from('checkins').select('id', { count: 'exact', head: true }).in('aluno_id', alunoIds).gte('data_checkin', inicioMes),
        supabase.from('treinos').select('id', { count: 'exact', head: true }).in('aluno_id', alunoIds).lte('data_inicio', hoje).or(`data_fim.is.null,data_fim.gte.${hoje}`),
      ]);
      setOperacao({
        unidades,
        adesao: unidades ? Math.round((ativos / unidades) * 100) : 0,
        checkinsMes: checkinsMes || 0,
        treinosAtivos: treinosAtivos || 0,
        plantao: (orgRow?.metadata as any)?.plantao_periodicidade || 'Mensal',
      });
    } else {
      setOperacao({ unidades, adesao: 0, checkinsMes: 0, treinosAtivos: 0, plantao: (orgRow?.metadata as any)?.plantao_periodicidade || 'Mensal' });
    }

    const { data: aulasFut } = await supabase.from('aulas')
      .select('id, nome, data_aula, horario_inicio, capacidade_maxima, inscritos_atual, professor_id')
      .gte('data_aula', hoje).lte('data_aula', seteDias).order('data_aula').order('horario_inicio');
    const profIds = [...new Set((aulasFut || []).map((a: any) => a.professor_id).filter(Boolean))];
    const { data: profs } = profIds.length
      ? await supabase.from('funcionarios').select('id, nome').in('id', profIds)
      : { data: [] as any };
    const profMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p.nome]));
    const mapAula = (a: any): Aula => ({
      id: a.id, nome: a.nome, horario_inicio: a.horario_inicio,
      capacidade: a.capacidade_maxima || 0, inscritos: a.inscritos_atual || 0,
      professor: profMap[a.professor_id] || '—', data: a.data_aula,
    });
    setAulasSemana((aulasFut || []).map(mapAula));
    setAulasHoje((aulasFut || []).filter((a: any) => a.data_aula === hoje).map(mapAula));

    const seteAtras = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data: aulas7 } = await supabase.from('aulas')
      .select('capacidade_maxima, inscritos_atual')
      .gte('data_aula', seteAtras).lte('data_aula', hoje);
    const ocup = (aulas7 || []).filter((a: any) => a.capacidade_maxima > 0);
    const ocupacao = ocup.length
      ? Math.round(ocup.reduce((s: number, a: any) => s + (a.inscritos_atual / a.capacidade_maxima), 0) / ocup.length * 100)
      : 0;

    setMetrics({ alunos: alunoIds.length, receita, inadCount: inadList.length, ocupacao });
    setInad(inadList);

    const { data: tk } = await supabase.from('support_tickets')
      .select('id, message, status, created_at, agent_response')
      .ilike('message', `[${activeOrg.nome}]%`)
      .order('created_at', { ascending: false }).limit(20);
    setTickets(tk || []);
  };

  useEffect(() => { carregar(); }, [activeOrg]);

  if (!ready) {
    return (
      <PersonaLayout title="Painel do Síndico" accent={ACCENT}>
        <div className="min-h-[320px] flex items-center justify-center text-sm text-muted-foreground">Carregando contexto…</div>
      </PersonaLayout>
    );
  }

  if (!activeOrg) {
    return (
      <PersonaLayout title="Painel do Síndico" accent={ACCENT}>
        <PersonaEmptyState message="Nenhum condomínio selecionado. Selecione um contexto para visualizar o painel." />
      </PersonaLayout>
    );
  }

  const solicitarCobranca = async (i: Inad) => {
    if (!activeOrg) return;
    const { error } = await supabase.from('support_tickets').insert({
      message: `[${activeOrg.nome}] Solicitar cobrança de ${i.nome} — R$ ${i.valor.toFixed(2)} vencido há ${i.dias} dias`,
      category: 'cobranca',
    });
    if (error) return toast.error('Falha');
    toast.success(`Cobrança de ${i.nome} solicitada`);
    carregar();
  };

  const enviarSolicitacao = async () => {
    if (!mensagem.trim() || !activeOrg) return toast.error('Escreva uma mensagem');
    setEnviando(true);
    const { error } = await supabase.from('support_tickets').insert({
      message: `[${activeOrg.nome}] ${mensagem}`, category: 'condominio',
    });
    setEnviando(false);
    if (error) return toast.error('Falha');
    toast.success('Solicitação enviada');
    setMensagem(''); carregar();
  };

  const enviarComunicado = async () => {
    if (!aviso.titulo.trim() || !aviso.mensagem.trim()) return toast.error('Preencha título e mensagem');
    const { error } = await supabase.from('notificacoes').insert({
      titulo: `[${activeOrg?.nome}] ${aviso.titulo}`,
      mensagem: aviso.mensagem,
      tipo: 'comunicado',
      destinatario_tipo: 'todos',
      prioridade: 'normal',
      status: 'pendente',
    });
    if (error) return toast.error('Falha ao enviar');
    toast.success('Comunicado publicado');
    setAviso({ titulo: '', mensagem: '' });
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      open: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    };
    const lbl: Record<string, string> = { open: 'aberto', in_progress: 'em andamento', resolved: 'resolvido' };
    return <Badge variant="outline" className={map[s] || ''}>{lbl[s] || s}</Badge>;
  };

  const statusSaude = metrics.inadCount > 10
    ? { txt: '⚠ Atenção', cls: 'text-amber-400' }
    : { txt: '✓ Saudável', cls: 'text-emerald-400' };

  // Sinal de possível problema de vínculo: a organização tem cadastro (metadata com
  // unidades esperadas) mas a consulta direta não retornou nenhum aluno vinculado.
  // Isso é diferente de "condomínio novo, ainda sem alunos" — nesse caso não há
  // unidades esperadas cadastradas, então não mostramos o aviso.
  const possivelProblemaDeVinculo = !dashLoading && !dashError && metrics.alunos === 0 && orgTemUnidadesEsperadas;

  return (
    <PersonaLayout title="Painel do Síndico" accent={ACCENT}>
      <Card className="bg-card/60 border-border/40 mb-4">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold"
                 style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}>{iniciais}</div>
            <div>
              <div className="font-medium">{activeOrg?.nome || 'Selecione um condomínio'}</div>
              <div className="text-xs text-muted-foreground">Condomínio residencial</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{metrics.alunos} alunos</Badge>
            <Badge variant="secondary">R$ {(metrics.receita / 1000).toFixed(1)}k</Badge>
          </div>
        </CardContent>
      </Card>

      {dashError && (
        <div className="mb-4"><DashboardError message={dashError} onRetry={refreshDash} /></div>
      )}

      {possivelProblemaDeVinculo && (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-amber-400">Nenhum aluno vinculado a este condomínio</p>
              <p className="text-muted-foreground mt-1">
                Este condomínio tem unidades cadastradas, mas nenhum aluno aparece vinculado a ele.
                Isso pode indicar que o vínculo (<code className="font-mono">alunos.user_id</code> /
                {' '}<code className="font-mono">organization_id</code>) ainda não foi feito para esta
                organização — verifique antes de considerar o painel "vazio".
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Alunos ativos" value={dashLoading ? '…' : (dash?.alunos_ativos ?? metrics.alunos)} hint="via dashboard_sindico" />
        <KpiCard label="Taxa de adesão" value={operacao.adesao ? `${operacao.adesao}%` : '--'} hint={`${operacao.unidades} unidades`} />
        <KpiCard label="Check-ins no mês" value={operacao.checkinsMes} />
        <KpiCard label="Aulas hoje" value={dashLoading ? '…' : (dash?.aulas_hoje ?? 0)} />
        {canSeeFinancials && (
          <KpiCard label="Receita do mês"
                   value={`R$ ${Number(dash?.receita_mes ?? metrics.receita).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} />
        )}
        {canSeeFinancials && (
          <KpiCard label="Inadimplência"
                   value={`${dash?.inadimplentes ?? metrics.inadCount} pessoa${(dash?.inadimplentes ?? metrics.inadCount) !== 1 ? 's' : ''}`}
                   hint={dash ? `R$ ${Number(dash.valor_inadimplencia || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em aberto` : undefined}
                   tone={(dash?.inadimplentes ?? metrics.inadCount) > 0 ? 'warning' : 'default'} />
        )}
        <KpiCard label="Ocupação média" value={dash?.ocupacao_media != null ? `${dash.ocupacao_media}%` : (metrics.ocupacao ? `${metrics.ocupacao}%` : '--')} />
        <KpiCard label="Status" value={dash?.status === 'saudavel' ? '✓ Saudável' : statusSaude.txt}
                 tone={dash?.status === 'saudavel' ? 'positive' : 'warning'} />
      </div>


      {isComite && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-2 text-xs">
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Você está no <strong className="text-foreground">modo Comitê</strong> — visão consultiva, sem acesso a dados financeiros ou de contrato.</span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="visao">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="aulas">Aulas</TabsTrigger>
          <TabsTrigger value="healthday">Health Day</TabsTrigger>
          <TabsTrigger value="comunicados">Comunicados</TabsTrigger>
          {canSeeFinancials && <TabsTrigger value="9fit">Falar com 9FIT</TabsTrigger>}
        </TabsList>

        <TabsContent value="visao">
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-4 flex gap-3">
                <QrCode className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Onboarding QR</p>
                  <p className="text-sm font-medium">{operacao.unidades} unidades · {operacao.adesao}% de adesão</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-4 flex gap-3">
                <Dumbbell className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Planos ativos</p>
                  <p className="text-sm font-medium">{operacao.treinosAtivos} treino{operacao.treinosAtivos === 1 ? '' : 's'} em execução</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-4 flex gap-3">
                <ClipboardCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Plantão 9FIT</p>
                  <p className="text-sm font-medium">{operacao.plantao} · QR academia/elevador</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/60 border-border/40 mb-4">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide">Relatório do mês</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeOrg?.nome || 'Organização'} · Receita R$ {metrics.receita.toFixed(2)} · {metrics.inadCount} inadimplente(s) · Ocupação {metrics.ocupacao}%
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const rows = [
                    ['Métrica', 'Valor'],
                    ['Organização', activeOrg?.nome || ''],
                    ['Alunos ativos', String(metrics.alunos)],
                    ['Total de unidades', String(operacao.unidades)],
                    ['Taxa de adesão (%)', String(operacao.adesao)],
                    ['Check-ins no mês', String(operacao.checkinsMes)],
                    ['Treinos ativos', String(operacao.treinosAtivos)],
                    ['Plantão presencial', operacao.plantao],
                    ['Receita do mês (R$)', metrics.receita.toFixed(2)],
                    ['Inadimplentes (qtd)', String(metrics.inadCount)],
                    ['Ocupação média (%)', String(metrics.ocupacao)],
                    ['Recomendação 9FIT', operacao.adesao < 15 ? 'Reforçar QR em elevador e comunicado no WhatsApp' : 'Manter cadência de plantão e comunicar evolução mensal'],
                    [],
                    ['Inadimplente', 'Dias em atraso', 'Valor (R$)'],
                    ...inad.map(i => [i.nome, String(i.dias), i.valor.toFixed(2)]),
                  ];
                  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `relatorio-sindico-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Relatório baixado');
                }}
              >
                Baixar CSV
              </Button>
            </CardContent>
          </Card>


          <Card className="bg-card/60 border-border/40 mb-4">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm uppercase tracking-wide">Inadimplentes</h2>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              {inad.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum inadimplente. 🎉</p> : (
                <ul className="divide-y divide-border/30">
                  {inad.slice(0, 5).map(i => (
                    <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{i.nome}</div>
                        <div className="text-xs text-muted-foreground">Vencido há {i.dias} dias • R$ {i.valor.toFixed(2)}</div>
                      </div>
                      <Button size="sm" onClick={() => solicitarCobranca(i)}
                              className="bg-[#60A5FA] text-black hover:bg-[#60A5FA]/90 shrink-0">
                        Solicitar cobrança
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5">
              <h2 className="font-semibold text-sm uppercase tracking-wide mb-3">Aulas hoje</h2>
              {aulasHoje.length === 0 ? <p className="text-sm text-muted-foreground">Sem aulas hoje.</p> : (
                <ul className="divide-y divide-border/30">
                  {aulasHoje.map(a => {
                    const ocup = a.capacidade ? a.inscritos / a.capacidade : 0;
                    const st = ocup < 0.5
                      ? { txt: 'Baixa ocupação', cls: 'text-amber-400' }
                      : { txt: 'Confirmada', cls: 'text-emerald-400' };
                    return (
                      <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{a.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.horario_inicio?.slice(0, 5)} • Prof. {a.professor} • {a.inscritos}/{a.capacidade}
                          </div>
                        </div>
                        <span className={`text-xs ${st.cls} shrink-0`}>{st.txt}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alunos">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nome</TableHead><TableHead>Status</TableHead>
                  <TableHead>Mensalidade</TableHead><TableHead>Desde</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {alunosLista.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{a.status}</Badge></TableCell>
                      <TableCell>R$ {Number(a.valor_mensalidade || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.data_matricula}</TableCell>
                    </TableRow>
                  ))}
                  {!alunosLista.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                        {orgTemUnidadesEsperadas
                          ? 'Nenhum aluno vinculado ainda. Verifique o vínculo do aluno com esta organização.'
                          : 'Nenhum aluno.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aulas">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Aula</TableHead>
                  <TableHead>Professor</TableHead><TableHead>Ocupação</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {aulasSemana.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{a.data} {a.horario_inicio?.slice(0,5)}</TableCell>
                      <TableCell>{a.nome}</TableCell>
                      <TableCell>{a.professor}</TableCell>
                      <TableCell>{a.inscritos}/{a.capacidade}</TableCell>
                    </TableRow>
                  ))}
                  {!aulasSemana.length && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">Sem aulas nos próximos 7 dias.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="healthday">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse className="w-4 h-4" style={{ color: ACCENT }} />
            <h2 className="font-semibold">Health Day</h2>
          </div>
          <HealthDayQRGenerator />
        </TabsContent>

        <TabsContent value="comunicados">
          {canManageComunicados ? (
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Megaphone className="w-4 h-4" style={{ color: ACCENT }} />
                  <h2 className="font-semibold">Publicar comunicado</h2>
                </div>
                <input value={aviso.titulo}
                       onChange={e => setAviso({ ...aviso, titulo: e.target.value })}
                       placeholder="Título do aviso"
                       className="w-full bg-background border border-border/40 rounded-md px-3 py-2 text-sm mb-2" />
                <Textarea value={aviso.mensagem}
                          onChange={e => setAviso({ ...aviso, mensagem: e.target.value })}
                          placeholder="Mensagem para os alunos…" rows={4} className="mb-3" />
                <Button onClick={enviarComunicado} className="bg-[#60A5FA] text-black hover:bg-[#60A5FA]/90">
                  <Megaphone className="w-4 h-4 mr-1" /> Publicar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-5 text-sm text-muted-foreground text-center">
                <Megaphone className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
                Modo Comitê: comunicados são apenas leitura. Peça ao síndico para publicar novos avisos.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="9fit">
          <Card className="bg-card/60 border-border/40 mb-4">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <LifeBuoy className="w-4 h-4" style={{ color: ACCENT }} />
                <h2 className="font-semibold">Falar com a equipe 9FIT</h2>
              </div>
              <Textarea value={mensagem} onChange={e => setMensagem(e.target.value)}
                        placeholder="Ex.: Aula de pilates de terça precisa mudar de horário…"
                        rows={4} className="mb-3" />
              <Button onClick={enviarSolicitacao} disabled={enviando}
                      className="bg-[#60A5FA] text-black hover:bg-[#60A5FA]/90">
                <MessageSquarePlus className="w-4 h-4 mr-1" />
                {enviando ? 'Enviando…' : 'Enviar solicitação'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Inbox className="w-4 h-4" style={{ color: ACCENT }} />
                <h2 className="font-semibold">Minhas solicitações</h2>
                <Badge variant="outline" className="ml-auto">{tickets.length}</Badge>
              </div>
              {tickets.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma solicitação enviada.</p> : (
                <ul className="space-y-3">
                  {tickets.map(t => (
                    <li key={t.id} className="border border-border/30 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-sm flex-1">{t.message.replace(`[${activeOrg?.nome}] `, '')}</p>
                        {statusBadge(t.status)}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {new Date(t.created_at).toLocaleString('pt-BR')}
                      </p>
                      {t.agent_response && (
                        <p className="text-xs mt-2 p-2 bg-muted/30 rounded border-l-2" style={{ borderColor: ACCENT }}>
                          <strong>9FIT:</strong> {t.agent_response}
                        </p>
                      )}
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

function MetricCard({ label, value, valueCls }: { label: string; value: string; valueCls?: string }) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
        <div className={`text-xl font-semibold ${valueCls || ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
