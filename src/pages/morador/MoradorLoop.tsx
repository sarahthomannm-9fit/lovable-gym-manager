import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAlunoVinculo } from '@/hooks/useAlunoVinculo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, ClipboardList, CreditCard, Dumbbell, LifeBuoy, MessageCircle, Bell, Activity } from 'lucide-react';

const db = supabase as any;
const ACCENT = '#1B6E6E';
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => new Date(Date.now() + n * 86400000);
const dt = (d: string, t?: string) => new Date(`${d}T${(t || '00:00').slice(0, 5)}:00`);
const hhmm = (t?: string) => (t || '').slice(0, 5);
const fmtDia = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
const duracao = (a: any) => Math.max(0, Math.round((dt(a.data_aula, a.horario_fim).getTime() - dt(a.data_aula, a.horario_inicio).getTime()) / 60000));

const Vazio = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground border border-dashed border-border/40 rounded-sm p-6 text-center">{children}</p>
);

const FAQ = [
  ['Como faço check-in?', 'O check-in abre 15 minutos antes da aula em que você está inscrito e fecha quando a aula termina.'],
  ['Como cancelo uma aula?', 'Na aba Aulas, toque em "Cancelar inscrição" no card da aula.'],
  ['Quando recebo meu treino?', 'Depois de enviar a anamnese, seu coach analisa e cria o treino. Você é avisado quando estiver pronto.'],
  ['Como pago minha mensalidade?', 'No card de pagamento da aba Início você vê o valor e o vencimento. A cobrança online ainda está em implantação.'],
  ['Preciso refazer a anamnese?', 'Se sua saúde ou objetivos mudaram, envie uma nova avaliação pela aba Início.'],
];

export default function MoradorLoop() {
  const navigate = useNavigate();
  const { aluno: vinculo, loading: vLoading } = useAlunoVinculo();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inicio');
  const [aluno, setAluno] = useState<any>(null);
  const [aulas, setAulas] = useState<any[]>([]);
  const [insc, setInsc] = useState<Record<string, any>>({});
  const [treinos, setTreinos] = useState<any[]>([]);
  const [execHoje, setExecHoje] = useState<Set<string>>(new Set());
  const [anamnese, setAnamnese] = useState<any>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [pags, setPags] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<Record<string, string>>({});
  const [visao, setVisao] = useState<'semana' | 'mes'>('semana');
  const [busy, setBusy] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);
  const [treinoView, setTreinoView] = useState<any>(null);
  const [exerciciosView, setExerciciosView] = useState<any[]>([]);
  const [formAnam, setFormAnam] = useState({ historico: '', limitacoes: '', objetivo: '', lesoes: '', frequencia: '' });
  const [mostrarAnam, setMostrarAnam] = useState(false);
  const [msg, setMsg] = useState('');
  const [pagDialog, setPagDialog] = useState(false);

  const load = useCallback(async () => {
    if (!vinculo?.id) { setLoading(false); return; }
    const { data: al } = await db.from('alunos')
      .select('id,nome,user_id,organization_id,plano_id,valor_mensalidade,planos(nome,valor)')
      .eq('id', vinculo.id).maybeSingle();
    setAluno(al);
    if (!al) { setLoading(false); return; }
    const hoje = iso(new Date());
    let qa = db.from('aulas')
      .select('id,nome,data_aula,horario_inicio,horario_fim,capacidade_maxima,inscritos_atual,status,professor_id,modalidade')
      .in('status', ['agendada', 'em_andamento', 'cancelada'])
      .gte('data_aula', hoje).lte('data_aula', iso(addDays(45)))
      .order('data_aula').order('horario_inicio');
    if (al.organization_id) qa = qa.eq('organization_id', al.organization_id);
    const destinos = [al.id, al.user_id].filter(Boolean);
    const [a, i, t, ex, an, n, tk, pg] = await Promise.all([
      qa,
      db.from('aulas_inscritos').select('id,aula_id,status').eq('aluno_id', al.id),
      db.from('treinos').select('id,nome,descricao,data_inicio,data_fim,status,professor_id,created_at').eq('aluno_id', al.id).order('created_at', { ascending: false }),
      db.from('treino_execucoes').select('treino_id').eq('aluno_id', al.id).eq('data_execucao', hoje),
      db.from('anamnese_respostas').select('id,status,preenchido_em,created_at').eq('aluno_id', al.id).order('created_at', { ascending: false }).limit(1),
      db.from('notificacoes').select('id,titulo,mensagem,prioridade,status,created_at,data_agendada,tipo').in('destinatario_id', destinos).order('created_at', { ascending: false }).limit(50),
      db.from('support_tickets').select('id,message,status,agent_response,created_at').eq('aluno_id', al.id).order('created_at', { ascending: false }).limit(10),
      db.from('pagamentos').select('id,valor,data_vencimento,data_pagamento,status,observacoes').eq('aluno_id', al.id).order('data_vencimento', { ascending: false }).limit(6),
    ]);
    const aulasList = a.data || [];
    setAulas(aulasList);
    setInsc(Object.fromEntries((i.data || []).map((r: any) => [r.aula_id, r])));
    const tr = (t.data || []).filter((x: any) => x.status !== 'revisado' && x.status !== 'inativo');
    setTreinos(tr);
    setExecHoje(new Set((ex.data || []).map((r: any) => r.treino_id)));
    setAnamnese((an.data || [])[0] || null);
    const agora = new Date();
    setNotifs((n.data || []).filter((x: any) => !x.data_agendada || new Date(x.data_agendada) <= agora));
    setTickets(tk.data || []);
    setPags(pg.data || []);
    const profIds = Array.from(new Set([...aulasList.map((x: any) => x.professor_id), ...tr.map((x: any) => x.professor_id)].filter(Boolean)));
    if (profIds.length) {
      const { data: pr } = await db.from('profiles').select('id,nome').in('id', profIds);
      setCoaches(Object.fromEntries((pr || []).map((p: any) => [p.id, p.nome])));
    }
    setLoading(false);
  }, [vinculo?.id]);

  useEffect(() => { if (!vLoading) load().catch(() => setLoading(false)); }, [vLoading, load]);

  const coach = (id?: string) => (id && coaches[id]) || 'Coach';
  const lotada = (a: any) => a.capacidade_maxima != null && (a.inscritos_atual ?? 0) >= a.capacidade_maxima;
  const ativa = (a: any) => insc[a.id] && ['inscrito', 'presente', 'lista_espera'].includes(insc[a.id].status);

  const bloqueioCheckin = (a: any): string | null => {
    if (a.status === 'cancelada') return 'Aula cancelada';
    if (!insc[a.id] || !['inscrito', 'presente'].includes(insc[a.id].status)) return 'Inscreva-se para fazer check-in';
    if (insc[a.id].status === 'presente') return 'Presença já registrada';
    const ini = dt(a.data_aula, a.horario_inicio), fim = dt(a.data_aula, a.horario_fim);
    const now = new Date();
    if (now > fim) return 'Aula já encerrada';
    if (now.getTime() < ini.getTime() - 15 * 60000) return `Libera às ${new Date(ini.getTime() - 15 * 60000).toTimeString().slice(0, 5)}`;
    return null;
  };

  const checkin = async (a: any) => {
    const b = bloqueioCheckin(a);
    if (b) return toast.error(b);
    setBusy(true);
    const { error } = await db.from('checkins').insert({ aluno_id: aluno.id, data_checkin: iso(new Date()), horario_entrada: new Date().toISOString() });
    if (error) { setBusy(false); return toast.error('Não foi possível registrar o check-in'); }
    await db.from('aulas_inscritos').update({ status: 'presente' }).eq('id', insc[a.id].id);
    setBusy(false);
    toast.success(`Check-in confirmado em ${a.nome}. Bom treino!`);
    load();
  };

  const inscrever = async (a: any) => {
    if (a.status === 'cancelada') return toast.error('Aula cancelada');
    setBusy(true);
    const status = lotada(a) ? 'lista_espera' : 'inscrito';
    const ex = insc[a.id];
    const { error } = ex
      ? await db.from('aulas_inscritos').update({ status }).eq('id', ex.id)
      : await db.from('aulas_inscritos').insert({ aula_id: a.id, aluno_id: aluno.id, status });
    setBusy(false);
    if (error) return toast.error('Não foi possível concluir a inscrição');
    toast.success(status === 'lista_espera' ? 'Aula lotada: você entrou na lista de espera' : 'Inscrição confirmada');
    load();
  };

  const cancelar = async (a: any) => {
    setBusy(true);
    const { error } = await db.from('aulas_inscritos').update({ status: 'cancelado' }).eq('id', insc[a.id].id);
    setBusy(false);
    if (error) return toast.error('Não foi possível cancelar');
    toast.success('Inscrição cancelada');
    load();
  };

  const concluir = async (t: any) => {
    setBusy(true);
    const { error } = await db.from('treino_execucoes').insert({ treino_id: t.id, aluno_id: aluno.id, data_execucao: iso(new Date()), concluido: true });
    setBusy(false);
    if (error) return toast.error('Não foi possível marcar como concluído');
    toast.success('Treino concluído. Parabéns!');
    load();
  };

  const abrirTreino = async (t: any) => {
    setTreinoView(t); setExerciciosView([]);
    try {
      const { data } = await db.rpc('student_workout');
      if (data?.treino?.id === t.id) setExerciciosView(data.exercicios || []);
    } catch { /* detalhes de exercícios indisponíveis */ }
  };

  const abrirComunicado = async (n: any) => {
    setAberto(aberto === n.id ? null : n.id);
    if (n.status !== 'lida') {
      const { error } = await db.from('notificacoes').update({ status: 'lida', data_leitura: new Date().toISOString() }).eq('id', n.id);
      if (!error) setNotifs((l) => l.map((x) => (x.id === n.id ? { ...x, status: 'lida' } : x)));
    }
  };

  const filled = Object.values(formAnam).filter((v) => v.trim()).length;
  const enviarAnamnese = async () => {
    if (filled < 5) return toast.error('Preencha todas as perguntas para enviar');
    setBusy(true);
    const { error } = await db.from('anamnese_respostas').insert({
      aluno_id: aluno.id, token: crypto.randomUUID(), tipo: 'par_q', respostas: formAnam,
      status: 'preenchido', preenchido_em: new Date().toISOString(),
    });
    setBusy(false);
    if (error) return toast.error('Não foi possível enviar a anamnese');
    toast.success('Anamnese enviada para o seu coach');
    setMostrarAnam(false);
    load();
  };

  const abrirChamado = async () => {
    if (!msg.trim()) return toast.error('Escreva sua mensagem');
    setBusy(true);
    const { error } = await db.from('support_tickets').insert({ aluno_id: aluno.id, message: msg.trim(), category: 'geral', status: 'open' });
    setBusy(false);
    if (error) return toast.error('Não foi possível enviar sua mensagem');
    toast.success('Mensagem enviada ao suporte');
    setMsg('');
    load();
  };

  const registrarIntencao = async (metodo: string) => {
    const p = pags.find((x) => x.status !== 'pago');
    if (!p) { setPagDialog(false); return; }
    const { error } = await db.from('pagamentos').update({ observacoes: `${p.observacoes ? p.observacoes + ' | ' : ''}Intenção de pagamento via ${metodo} em ${new Date().toLocaleDateString('pt-BR')}` }).eq('id', p.id);
    setPagDialog(false);
    if (error) return toast.error('Não foi possível registrar');
    toast.info('Pagamento online em breve. Registramos sua intenção e a administração entrará em contato.');
    load();
  };

  const proxima = useMemo(() => aulas.find((a) => ativa(a) && a.status !== 'cancelada' && dt(a.data_aula, a.horario_fim) > new Date()), [aulas, insc]);
  const naoLidos = notifs.filter((n) => n.status !== 'lida').length;
  const anamEnviada = anamnese && ['preenchido', 'aprovado'].includes(anamnese.status);
  const pagPend = pags.find((p) => p.status !== 'pago');
  const atrasado = pagPend && (pagPend.status === 'atrasado' || pagPend.data_vencimento < iso(new Date()));
  const limite = iso(addDays(visao === 'semana' ? 7 : 31));
  const grade = aulas.filter((a) => a.data_aula <= limite);
  const dias = Array.from(new Set(grade.map((a) => a.data_aula)));

  const Badges = ({ a }: { a: any }) => (
    <div className="flex gap-1 flex-wrap">
      {a.status === 'cancelada' && <Badge variant="destructive">Cancelada</Badge>}
      {ativa(a) && <Badge>{insc[a.id].status === 'lista_espera' ? 'Lista de espera' : 'Inscrito'}</Badge>}
      {lotada(a) && a.status !== 'cancelada' && <Badge variant="outline">Lotado</Badge>}
    </div>
  );

  const Acoes = ({ a }: { a: any }) => {
    if (a.status === 'cancelada') return null;
    const bloq = bloqueioCheckin(a);
    return (
      <div className="flex gap-2 flex-wrap items-center">
        {ativa(a) ? (
          <>
            <Button size="sm" disabled={busy || !!bloq} title={bloq || ''} onClick={() => checkin(a)} style={!bloq ? { backgroundColor: ACCENT, color: '#fff' } : undefined}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Check-in
            </Button>
            <Button size="sm" variant="ghost" disabled={busy || insc[a.id].status === 'presente'} onClick={() => cancelar(a)}>Cancelar inscrição</Button>
            {bloq && <span className="text-xs text-muted-foreground">{bloq}</span>}
          </>
        ) : (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => inscrever(a)}>{lotada(a) ? 'Entrar na lista de espera' : 'Inscrever-se'}</Button>
        )}
      </div>
    );
  };

  if (loading || vLoading) {
    return <PersonaLayout title="Meu painel" subtitle="Área do aluno" accent={ACCENT}><p className="text-sm text-muted-foreground py-16 text-center">Carregando…</p></PersonaLayout>;
  }
  if (!aluno) {
    return <PersonaLayout title="Meu painel" subtitle="Área do aluno" accent={ACCENT}><Vazio>Seu cadastro de aluno ainda não foi vinculado. Fale com a administração.</Vazio></PersonaLayout>;
  }

  const nome = (aluno.nome || '').split(' ')[0];

  return (
    <PersonaLayout title="Meu painel" subtitle="Área do aluno" accent={ACCENT}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="inicio">Início</TabsTrigger>
          <TabsTrigger value="aulas">Aulas</TabsTrigger>
          <TabsTrigger value="treinos">Treinos</TabsTrigger>
          <TabsTrigger value="comunicados">Comunicados{naoLidos > 0 && <span className="ml-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center px-1.5">{naoLidos}</span>}</TabsTrigger>
          <TabsTrigger value="suporte">Suporte</TabsTrigger>
        </TabsList>

        <TabsContent value="inicio" className="space-y-4">
          <h2 className="text-2xl font-semibold">Olá, {nome}</h2>

          <Card className="bg-card/60 border-border/40"><CardContent className="p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Próxima aula</p>
            {proxima ? (
              <>
                <div>
                  <p className="text-lg font-semibold">{proxima.nome}</p>
                  <p className="text-sm text-muted-foreground">{fmtDia(proxima.data_aula)} · {hhmm(proxima.horario_inicio)}–{hhmm(proxima.horario_fim)} · {coach(proxima.professor_id)}</p>
                </div>
                <Acoes a={proxima} />
              </>
            ) : <Vazio>Você não está inscrito em nenhuma aula. Veja a grade na aba Aulas.</Vazio>}
          </CardContent></Card>

          {!anamEnviada && (
            <Card className="border-primary/30 bg-primary/5"><CardContent className="p-5 flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-primary shrink-0" />
              <div className="flex-1"><p className="font-semibold">Solicite sua avaliação</p><p className="text-sm text-muted-foreground">Envie sua anamnese para receber seu treino.</p></div>
              <Button onClick={() => { setTab('treinos'); setMostrarAnam(true); }}>Começar</Button>
            </CardContent></Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card/60 border-border/40 cursor-pointer" onClick={() => setTab('treinos')}><CardContent className="p-4"><Dumbbell className="w-4 h-4 text-primary mb-1" /><p className="text-xs text-muted-foreground">Meus treinos</p><p className="text-xl font-semibold">{anamEnviada ? treinos.length : 0}</p></CardContent></Card>
            <Card className="bg-card/60 border-border/40 cursor-pointer" onClick={() => setTab('comunicados')}><CardContent className="p-4"><Bell className="w-4 h-4 text-primary mb-1" /><p className="text-xs text-muted-foreground">Comunicados novos</p><p className="text-xl font-semibold">{naoLidos}</p></CardContent></Card>
          </div>

          {pagPend && (
            <Card className={atrasado ? 'border-amber-500/40 bg-amber-500/5' : 'bg-card/60 border-border/40'}><CardContent className="p-5 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />Pagamento</p>
              <p className="font-semibold">{aluno.planos?.nome || 'Plano'} · R$ {Number(pagPend.valor).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{atrasado ? `Seu pagamento venceu em ${new Date(pagPend.data_vencimento + 'T12:00').toLocaleDateString('pt-BR')}. Quando puder, regularize para manter o acesso.` : `Vence em ${new Date(pagPend.data_vencimento + 'T12:00').toLocaleDateString('pt-BR')}`}</p>
              <Button size="sm" onClick={() => setPagDialog(true)}>Renovar / pagar</Button>
            </CardContent></Card>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate('/morador/painel')}><Activity className="w-4 h-4 mr-2" />Ver minha evolução e treino do dia</Button>
        </TabsContent>

        <TabsContent value="aulas" className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={visao === 'semana' ? 'default' : 'outline'} onClick={() => setVisao('semana')}>Semana</Button>
            <Button size="sm" variant={visao === 'mes' ? 'default' : 'outline'} onClick={() => setVisao('mes')}>Mês</Button>
          </div>
          {dias.length === 0 ? <Vazio>Nenhuma aula publicada neste período.</Vazio> : dias.map((d) => (
            <section key={d} className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground capitalize">{fmtDia(d)}</h3>
              {grade.filter((a) => a.data_aula === d).map((a) => (
                <Card key={a.id} className="bg-card/60 border-border/40"><CardContent className="p-4 space-y-2">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">{hhmm(a.horario_inicio)} · {duracao(a)} min · {coach(a.professor_id)} · {a.inscritos_atual ?? 0}/{a.capacidade_maxima ?? '—'} vagas</p>
                    </div>
                    <Badges a={a} />
                  </div>
                  <Acoes a={a} />
                </CardContent></Card>
              ))}
            </section>
          ))}
        </TabsContent>

        <TabsContent value="treinos" className="space-y-3">
          {!anamEnviada || mostrarAnam ? (
            <Card className="bg-card/60 border-border/40"><CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" />Solicitar avaliação (anamnese)</h3>
              <Progress value={(filled / 5) * 100} />
              <p className="text-xs text-muted-foreground">{filled} de 5 perguntas respondidas</p>
              <Textarea placeholder="Histórico de saúde (doenças, cirurgias, medicamentos)" value={formAnam.historico} onChange={(e) => setFormAnam({ ...formAnam, historico: e.target.value })} />
              <Textarea placeholder="Limitações físicas" value={formAnam.limitacoes} onChange={(e) => setFormAnam({ ...formAnam, limitacoes: e.target.value })} />
              <Textarea placeholder="Lesões atuais ou antigas" value={formAnam.lesoes} onChange={(e) => setFormAnam({ ...formAnam, lesoes: e.target.value })} />
              <Textarea placeholder="Seus objetivos" value={formAnam.objetivo} onChange={(e) => setFormAnam({ ...formAnam, objetivo: e.target.value })} />
              <Input placeholder="Quantas vezes por semana quer treinar?" value={formAnam.frequencia} onChange={(e) => setFormAnam({ ...formAnam, frequencia: e.target.value })} />
              <Button className="w-full" disabled={busy} onClick={enviarAnamnese}>Enviar para o Coach</Button>
            </CardContent></Card>
          ) : (
            <>
              {anamnese.status === 'preenchido' && treinos.length === 0 && <Vazio>Anamnese enviada. Seu coach está preparando seu treino.</Vazio>}
              {treinos.map((t) => (
                <Card key={t.id} className="bg-card/60 border-border/40"><CardContent className="p-4 space-y-2">
                  <p className="font-medium">{t.nome || 'Treino'}</p>
                  <p className="text-xs text-muted-foreground">{coach(t.professor_id)} · criado em {new Date(t.created_at).toLocaleDateString('pt-BR')}{t.data_fim && ` · próxima revisão ${new Date(t.data_fim + 'T12:00').toLocaleDateString('pt-BR')}`}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => abrirTreino(t)}>Abrir treino</Button>
                    <Button size="sm" disabled={busy || execHoje.has(t.id)} onClick={() => concluir(t)}>{execHoje.has(t.id) ? 'Concluído hoje' : 'Marcar concluído'}</Button>
                  </div>
                </CardContent></Card>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setMostrarAnam(true)}>Enviar nova avaliação</Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="comunicados" className="space-y-2">
          {notifs.length === 0 ? <Vazio>Nenhum comunicado por enquanto.</Vazio> : notifs.map((n) => {
            const urgente = n.prioridade === 'urgente' || n.prioridade === 'alta';
            return (
              <Card key={n.id} onClick={() => abrirComunicado(n)} className={`cursor-pointer ${urgente ? 'border-amber-500/50 bg-amber-500/5' : 'bg-card/60 border-border/40'}`}><CardContent className="p-4">
                <div className="flex justify-between gap-2"><p className="font-medium text-sm">{n.titulo}</p>{n.status !== 'lida' && <Badge>Novo</Badge>}</div>
                <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString('pt-BR')}{urgente && ' · Urgente'}</p>
                {aberto === n.id && <p className="text-sm mt-2 whitespace-pre-wrap">{n.mensagem}</p>}
              </CardContent></Card>
            );
          })}
        </TabsContent>

        <TabsContent value="suporte" className="space-y-4">
          <Card className="bg-card/60 border-border/40"><CardContent className="p-5 space-y-2">
            <h3 className="font-semibold">Perguntas frequentes</h3>
            {FAQ.map(([q, r]) => (
              <details key={q} className="border-b border-border/30 pb-2"><summary className="cursor-pointer text-sm font-medium">{q}</summary><p className="text-sm text-muted-foreground mt-1">{r}</p></details>
            ))}
          </CardContent></Card>
          <Card className="bg-card/60 border-border/40"><CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Falar com suporte</h3>
            <Textarea placeholder="Como podemos ajudar?" value={msg} onChange={(e) => setMsg(e.target.value)} />
            <Button disabled={busy} onClick={abrirChamado}>Enviar mensagem</Button>
          </CardContent></Card>
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Minhas mensagens</h3>
          {tickets.length === 0 ? <Vazio>Você ainda não enviou mensagens ao suporte.</Vazio> : tickets.map((t) => (
            <Card key={t.id} className="bg-card/60 border-border/40"><CardContent className="p-4 space-y-1">
              <div className="flex justify-between"><p className="text-sm">{t.message}</p><Badge variant="outline">{t.status === 'open' ? 'Aberto' : t.status}</Badge></div>
              {t.agent_response && <p className="text-sm text-muted-foreground border-l-2 border-primary pl-2">{t.agent_response}</p>}
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>

      {tab !== 'suporte' && (
        <Button onClick={() => setTab('suporte')} className="fixed bottom-5 right-5 rounded-full h-12 w-12 p-0 shadow-lg z-20" style={{ backgroundColor: ACCENT, color: '#fff' }} aria-label="Suporte">
          <MessageCircle className="w-5 h-5" />
        </Button>
      )}

      <Dialog open={!!treinoView} onOpenChange={(o) => !o && setTreinoView(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{treinoView?.nome || 'Treino'}</DialogTitle></DialogHeader>
          <p className="text-sm whitespace-pre-wrap">{treinoView?.descricao || 'Sem descrição.'}</p>
          {exerciciosView.length > 0 && (
            <ul className="space-y-2">{exerciciosView.map((ex: any) => (
              <li key={ex.id} className="border-b border-border/30 pb-2 text-sm"><span className="font-medium">{ex.exercicios_biblioteca?.nome || 'Exercício'}</span><span className="block text-xs text-muted-foreground">{ex.series} séries × {ex.repeticoes}{ex.carga_kg ? ` · ${ex.carga_kg}kg` : ''}</span></li>
            ))}</ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={pagDialog} onOpenChange={setPagDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Como você prefere pagar?</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">O pagamento online ainda está em implantação. Registramos sua preferência e a administração entra em contato.</p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => registrarIntencao('PIX')}>PIX</Button>
            <Button variant="outline" onClick={() => registrarIntencao('cartão')}>Cartão</Button>
            <Button variant="outline" onClick={() => registrarIntencao('débito automático')}>Débito automático</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PersonaLayout>
  );
}
