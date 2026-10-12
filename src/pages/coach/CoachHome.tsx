import { useEffect, useMemo, useState } from 'react';
import { PersonaLayout, PersonaEmptyState } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Users, UserCheck, Dumbbell, History, ClipboardList, Sparkles, Play, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CriarTreinoDialog } from '@/components/CriarTreinoDialog';

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const aulaStart = (a: any) => new Date(`${a.data_aula}T${(a.horario_inicio || '00:00').slice(0, 5)}:00`);
const podeIniciar = (a: any) => {
  const diff = aulaStart(a).getTime() - Date.now();
  return a.status !== 'cancelada' && diff <= 15 * 60000 && diff > -3 * 3600000;
};
const Vazio = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground border border-dashed border-border/40 rounded-sm p-6 text-center">{children}</p>
);

export default function CoachHome() {
  const { activeOrg, ensureOrgForPersona, isAdmin } = useOperationalContext();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [aulas, setAulas] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [treinos, setTreinos] = useState<any[]>([]);
  const [execs, setExecs] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [anamnesesFila, setAnamnesesFila] = useState<any[]>([]);
  const [filaIACount, setFilaIACount] = useState(0);
  const [aprovando, setAprovando] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [tab, setTab] = useState('aulas');
  // Dialogs
  const [presencaAula, setPresencaAula] = useState<any | null>(null);
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [anamneseView, setAnamneseView] = useState<any | null>(null);
  const [revisao, setRevisao] = useState<any | null>(null);
  const [motivo, setMotivo] = useState('');
  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroAluno, setFiltroAluno] = useState<'ativos' | 'pendente' | 'revisao'>('ativos');
  const [filtroTreino, setFiltroTreino] = useState<'ativos' | 'inativos' | 'revisao'>('ativos');
  const [periodo, setPeriodo] = useState(30);

  useEffect(() => { ensureOrgForPersona('professor').finally(() => setReady(true)); }, []);

  const carregar = async () => {
    const orgId = activeOrg?.id;
    const hoje = iso(new Date());
    const seteDias = iso(new Date(Date.now() + 7 * DAY));
    const inicioHist = iso(new Date(Date.now() - 365 * DAY));

    let qa = supabase.from('aulas').select('id, nome, data_aula, horario_inicio, horario_fim, inscritos_atual, capacidade_maxima, status, professor_id')
      .gte('data_aula', iso(new Date(Date.now() - 365 * DAY))).lte('data_aula', seteDias).order('data_aula').order('horario_inicio');
    if (orgId) qa = qa.eq('organization_id', orgId);
    let qal = supabase.from('alunos').select('id, nome, status, user_id, plano_id, planos(nome)').order('nome').limit(200);
    if (orgId) qal = qal.eq('organization_id', orgId);
    const [{ data: au }, { data: al }] = await Promise.all([qa, qal]);
    setAulas(au || []);
    const alunosList = (al || []) as any[];
    setAlunos(alunosList);
    const ids = alunosList.map((a) => a.id);

    if (!ids.length) {
      setTreinos([]); setCheckins([]); setAnamnesesFila([]); setFeedbacks([]); setExecs([]);
    } else {
      const [{ data: tr }, { data: ck }, { data: an }, { data: fb }] = await Promise.all([
        supabase.from('treinos').select('id, nome, descricao, data_inicio, data_fim, aluno_id, status, professor_id, created_at, updated_at').in('aluno_id', ids).order('created_at', { ascending: false }).limit(300),
        supabase.from('checkins').select('id, aluno_id, data_checkin, horario_entrada').in('aluno_id', ids).gte('data_checkin', inicioHist).order('horario_entrada', { ascending: false }).limit(1000),
        supabase.from('anamnese_respostas').select('id, aluno_id, tipo, preenchido_em, respostas, status, alunos(nome, email)').in('aluno_id', ids).eq('status', 'preenchido').order('preenchido_em', { ascending: false }).limit(50),
        (supabase as any).from('workout_sessions').select('aluno_id, data, status, feedback').in('aluno_id', ids).not('feedback', 'is', null).order('data', { ascending: false }).limit(10),
      ]);
      const trList = (tr || []) as any[];
      setTreinos(trList);
      setCheckins(ck || []);
      setFeedbacks(fb || []);
      const comTreino = new Set(trList.filter((t) => !t.data_fim || t.data_fim >= hoje).map((t) => t.aluno_id));
      setAnamnesesFila((an || []).filter((a: any) => !comTreino.has(a.aluno_id)));
      const trIds = trList.map((t) => t.id);
      if (trIds.length) {
        const { data: ex } = await supabase.from('treino_execucoes').select('treino_id, data_execucao').in('treino_id', trIds).gte('data_execucao', iso(new Date(Date.now() - 14 * DAY)));
        setExecs(ex || []);
      } else setExecs([]);
    }

    let qf = supabase.from('treinos_ia_fila').select('id', { count: 'exact', head: true }).eq('status', 'pendente');
    if (orgId) qf = qf.eq('organization_id', orgId);
    const { count } = await qf;
    setFilaIACount(count || 0);
  };

  useEffect(() => { carregar(); }, [activeOrg?.id]);

  const hoje = iso(new Date());
  const aulasHoje = aulas.filter((a) => a.data_aula === hoje);
  const aulasProx = aulas.filter((a) => a.data_aula >= hoje);
  const treinoAtivoDe = (alunoId: string) => treinos.find((t) => t.aluno_id === alunoId && t.status !== 'revisado' && t.status !== 'inativo' && (!t.data_fim || t.data_fim >= hoje));
  const ultimaAula = (alunoId: string) => checkins.find((c) => c.aluno_id === alunoId)?.data_checkin;
  const revisaoVencida = (t: any) => t && t.data_fim && new Date(t.data_fim).getTime() - Date.now() < 7 * DAY;
  const nomeAluno = (id: string) => alunos.find((a) => a.id === id)?.nome || 'Aluno';
  const filaTotal = anamnesesFila.length + filaIACount;
  const revisoesPendentes = alunos.filter((a) => revisaoVencida(treinoAtivoDe(a.id))).length;

  const alunosFiltrados = useMemo(() => alunos.filter((a) => {
    if (busca && !a.nome?.toLowerCase().includes(busca.toLowerCase())) return false;
    const t = treinoAtivoDe(a.id);
    if (filtroAluno === 'ativos') return a.status === 'ativo';
    if (filtroAluno === 'pendente') return !t;
    return revisaoVencida(t);
  }), [alunos, treinos, busca, filtroAluno]);

  const treinosFiltrados = treinos.filter((t) => {
    const ativo = t.status !== 'revisado' && t.status !== 'inativo' && (!t.data_fim || t.data_fim >= hoje);
    if (filtroTreino === 'ativos') return ativo;
    if (filtroTreino === 'inativos') return !ativo;
    return ativo && revisaoVencida(t);
  });
  const ativosComExec = new Set(execs.map((e) => e.treino_id));
  const treinosAtivos = treinos.filter((t) => t.status !== 'revisado' && t.status !== 'inativo' && (!t.data_fim || t.data_fim >= hoje));
  const adesao = treinosAtivos.length ? Math.round(treinosAtivos.filter((t) => ativosComExec.has(t.id)).length / treinosAtivos.length * 100) : 0;

  const desde = iso(new Date(Date.now() - periodo * DAY));
  const hist = {
    aulas: aulas.filter((a) => a.data_aula >= desde && a.data_aula <= hoje && a.status !== 'cancelada').length,
    alunos: new Set(checkins.filter((c) => c.data_checkin >= desde).map((c) => c.aluno_id)).size,
    checkins: checkins.filter((c) => c.data_checkin >= desde).length,
    criados: treinos.filter((t) => (t.created_at || '').slice(0, 10) >= desde).length,
    revisados: treinos.filter((t) => t.status === 'revisado' && (t.updated_at || '').slice(0, 10) >= desde).length,
  };
  const freqMedia = hist.alunos ? (hist.checkins / hist.alunos).toFixed(1) : '0';

  const notificarAluno = async (alunoId: string, titulo: string, mensagem: string) => {
    const al = alunos.find((a) => a.id === alunoId);
    if (!al?.user_id) return;
    await supabase.from('notificacoes').insert({ tipo: 'treino', titulo, mensagem, destinatario_tipo: 'aluno', destinatario_id: al.user_id, prioridade: 'normal', status: 'pendente', canal: ['app'] });
  };

  const abrirPresenca = async (aula: any) => {
    setPresencaAula(aula);
    const { data } = await supabase.from('aulas_inscritos').select('id, aluno_id, status').eq('aula_id', aula.id);
    setInscritos(data || []);
  };
  const presentes = new Set(checkins.filter((c) => c.data_checkin === presencaAula?.data_aula).map((c) => c.aluno_id));
  const marcarPresenca = async (alunoId: string) => {
    const { error } = await supabase.from('checkins').insert({ aluno_id: alunoId, data_checkin: presencaAula?.data_aula || hoje });
    if (error) return toast.error('Falha ao registrar presença');
    toast.success(`Presença de ${nomeAluno(alunoId)} registrada`);
    carregar();
  };

  const cancelarAula = async (aula: any) => {
    if (!confirm(`Cancelar a aula "${aula.nome}"? Os inscritos verão a aula como cancelada.`)) return;
    const { error } = await supabase.from('aulas').update({ status: 'cancelada' }).eq('id', aula.id);
    if (error) return toast.error('Não foi possível cancelar a aula');
    toast.success('Aula cancelada');
    carregar();
  };

  const aprovarAnamnese = async (anamnese: any) => {
    if (!anamnese.aluno_id) return toast.error('Anamnese sem aluno vinculado');
    setAprovando(anamnese.id);
    const nome = anamnese.alunos?.nome || 'aluno';
    const { error } = await supabase.from('treinos').insert({
      aluno_id: anamnese.aluno_id, organization_id: activeOrg?.id || null, professor_id: user?.id || null,
      nome: `Plano inicial 9FIT — ${nome}`,
      descricao: 'Plano gerado a partir da anamnese e aprovado pelo professor.',
      data_inicio: hoje, data_fim: iso(new Date(Date.now() + 28 * DAY)), status: 'ativo',
    });
    if (!error) {
      await supabase.from('anamnese_respostas').update({ status: 'aprovado' }).eq('id', anamnese.id);
      await notificarAluno(anamnese.aluno_id, 'Seu treino está pronto', 'Seu coach criou seu treino. Veja em "Meus treinos".');
    }
    setAprovando(null);
    if (error) return toast.error('Falha ao aprovar treino');
    toast.success(`Treino de ${nome} criado e aluno notificado`);
    carregar();
  };

  const salvarRevisao = async () => {
    if (!revisao) return;
    if (!motivo.trim()) return toast.error('Informe o motivo da revisão');
    const { error } = await supabase.from('treinos').insert({
      aluno_id: revisao.aluno_id, organization_id: activeOrg?.id || null, professor_id: user?.id || null,
      plano_treino_id: revisao.plano_treino_id || null,
      nome: `${revisao.nome || 'Treino'} (revisão)`,
      descricao: `Motivo da revisão: ${motivo.trim()}\n\n${revisao.descricao || ''}`,
      data_inicio: hoje, data_fim: iso(new Date(Date.now() + 28 * DAY)), status: 'ativo',
    });
    if (error) return toast.error('Não foi possível criar a revisão');
    await supabase.from('treinos').update({ status: 'revisado' }).eq('id', revisao.id);
    await notificarAluno(revisao.aluno_id, 'Seu treino foi revisado', `Motivo: ${motivo.trim()}`);
    toast.success('Nova versão criada. A anterior ficou no histórico.');
    setRevisao(null); setMotivo('');
    carregar();
  };

  if (!activeOrg && ready && !isAdmin) {
    return (
      <PersonaLayout title="Meu dia" accent="hsl(var(--primary))">
        <PersonaEmptyState message="Você ainda não está vinculado a nenhum condomínio como coach." />
      </PersonaLayout>
    );
  }

  const AulaCard = ({ a, destaque }: { a: any; destaque?: boolean }) => {
    const cancelada = a.status === 'cancelada';
    const inscr = a.inscritos_atual ?? 0;
    return (
      <Card className={`border-border/40 ${destaque ? 'bg-primary/5' : 'bg-card/60'}`}>
        <CardContent className="p-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{a.nome}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(`${a.data_aula}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} · {a.horario_inicio?.slice(0, 5)}–{a.horario_fim?.slice(0, 5)} · {inscr}/{a.capacidade_maxima ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {cancelada ? <Badge variant="destructive">Cancelada</Badge> : (
              <>
                <Button size="sm" disabled={!podeIniciar(a)} onClick={() => abrirPresenca(a)} title="Liberado 15 min antes">
                  <Play className="w-3 h-3 mr-1" /> Iniciar aula
                </Button>
                <Button size="icon" variant="ghost" onClick={() => cancelarAula(a)} title="Cancelar aula"><XCircle className="w-4 h-4" /></Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const Chip = ({ on, onClick, children }: any) => (
    <Button size="sm" variant={on ? 'default' : 'outline'} className="shrink-0" onClick={onClick}>{children}</Button>
  );
  const Count = ({ n }: { n: number }) => n > 0 ? <span className="ml-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center px-1.5">{n}</span> : null;

  return (
    <PersonaLayout title="Meu dia">
      {/* Resumo do dia */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="bg-card/60 border-border/40"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Aulas hoje</p>
          <p className="text-2xl font-display">{aulasHoje.filter((a) => a.status !== 'cancelada').length}</p>
        </CardContent></Card>
        <Card className="bg-card/60 border-border/40 cursor-pointer" onClick={() => setTab('fila')}><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Na fila</p>
          <p className="text-2xl font-display">{filaTotal}</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="aulas"><Calendar className="w-3.5 h-3.5 mr-1.5" />Aulas</TabsTrigger>
          <TabsTrigger value="fila"><Sparkles className="w-3.5 h-3.5 mr-1.5" />Fila<Count n={filaTotal} /></TabsTrigger>
          <TabsTrigger value="alunos"><Users className="w-3.5 h-3.5 mr-1.5" />Alunos<Count n={revisoesPendentes} /></TabsTrigger>
          <TabsTrigger value="treinos"><Dumbbell className="w-3.5 h-3.5 mr-1.5" />Treinos</TabsTrigger>
          <TabsTrigger value="historico"><History className="w-3.5 h-3.5 mr-1.5" />Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="aulas" className="space-y-4">
          <section>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Hoje</h2>
            {aulasHoje.length === 0 ? <Vazio>Sem aulas hoje.</Vazio> : <div className="space-y-2">{aulasHoje.map((a) => <AulaCard key={a.id} a={a} destaque />)}</div>}
          </section>
          <section>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Próximos 7 dias</h2>
            {aulasProx.filter((a) => a.data_aula > hoje).length === 0 ? <Vazio>Nenhuma aula publicada para os próximos 7 dias.</Vazio> : (
              <div className="space-y-2">{aulasProx.filter((a) => a.data_aula > hoje).map((a) => <AulaCard key={a.id} a={a} />)}</div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="fila" className="space-y-4">
          {filaIACount > 0 && (
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <p className="flex-1 text-sm font-semibold">{filaIACount} sugestão(ões) de treino da IA aguardando aprovação</p>
                <Button size="sm" onClick={() => (window.location.href = '/treinos')}>Ver fila IA</Button>
              </CardContent>
            </Card>
          )}
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Anamneses pendentes ({anamnesesFila.length})
          </h2>
          {anamnesesFila.length === 0 ? <Vazio>Nenhuma anamnese pendente.</Vazio> : (
            <div className="space-y-2">
              {anamnesesFila.map((a: any) => {
                const r = (a.respostas || {}) as any;
                const objetivo = r.objetivo || r.objetivos || r.goal || '—';
                return (
                  <Card key={a.id} className="bg-card/60 border-border/40">
                    <CardContent className="p-4 space-y-2">
                      <div>
                        <p className="font-medium">{a.alunos?.nome || 'Aluno'}</p>
                        <p className="text-xs text-muted-foreground">{a.preenchido_em ? new Date(a.preenchido_em).toLocaleDateString('pt-BR') : '—'} · Objetivo: {String(objetivo)}</p>
                        {(r.limitacoes || r.historico) && <p className="text-xs text-muted-foreground line-clamp-2">{String(r.limitacoes || r.historico)}</p>}
                      </div>
                      <div className="flex gap-2 overflow-x-auto">
                        <Button size="sm" variant="outline" className="shrink-0" onClick={() => setAnamneseView(a)}>Revisar anamnese</Button>
                        <CriarTreinoDialog alunos={[{ id: a.aluno_id, nome: a.alunos?.nome || 'Aluno' }]} organizationId={activeOrg?.id} initialAlunoId={a.aluno_id}
                          onCriado={async () => { await supabase.from('anamnese_respostas').update({ status: 'aprovado' }).eq('id', a.id); await notificarAluno(a.aluno_id, 'Seu treino está pronto', 'Veja em "Meus treinos".'); carregar(); }}
                          trigger={<Button size="sm" className="shrink-0">Criar treino</Button>} />
                        <Button size="sm" variant="ghost" className="shrink-0" disabled={aprovando === a.id} onClick={() => aprovarAnamnese(a)}>
                          {aprovando === a.id ? 'Criando…' : 'Plano inicial rápido'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alunos" className="space-y-3">
          <Input placeholder="Buscar aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <div className="flex gap-2 overflow-x-auto">
            <Chip on={filtroAluno === 'ativos'} onClick={() => setFiltroAluno('ativos')}>Ativos</Chip>
            <Chip on={filtroAluno === 'pendente'} onClick={() => setFiltroAluno('pendente')}>Treino pendente</Chip>
            <Chip on={filtroAluno === 'revisao'} onClick={() => setFiltroAluno('revisao')}>Revisão vencida<Count n={revisoesPendentes} /></Chip>
          </div>
          {alunosFiltrados.length === 0 ? <Vazio>{alunos.length === 0 ? 'Nenhum aluno vinculado a este condomínio ainda.' : 'Nenhum aluno neste filtro.'}</Vazio> : (
            <div className="grid sm:grid-cols-2 gap-2">
              {alunosFiltrados.map((al) => {
                const t = treinoAtivoDe(al.id);
                return (
                  <Card key={al.id} className="bg-card/60 border-border/40">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-medium truncate">{al.nome}</p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">{al.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Plano: {al.planos?.nome || '—'} · Treino: {t ? t.nome || 'ativo' : 'pendente'}</p>
                      <p className="text-xs text-muted-foreground">Última revisão: {t?.data_inicio ? new Date(t.data_inicio + 'T12:00').toLocaleDateString('pt-BR') : '—'} · Última aula: {ultimaAula(al.id) ? new Date(ultimaAula(al.id) + 'T12:00').toLocaleDateString('pt-BR') : '—'}</p>
                      {t && revisaoVencida(t) && <Button size="sm" variant="outline" onClick={() => setRevisao(t)}>Revisar treino</Button>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="treinos" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Adesão (últimos 14 dias): <strong className="text-foreground">{adesao}%</strong></p>
            <CriarTreinoDialog alunos={alunos.map((a) => ({ id: a.id, nome: a.nome }))} organizationId={activeOrg?.id} onCriado={carregar} />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <Chip on={filtroTreino === 'ativos'} onClick={() => setFiltroTreino('ativos')}>Ativos</Chip>
            <Chip on={filtroTreino === 'inativos'} onClick={() => setFiltroTreino('inativos')}>Inativos</Chip>
            <Chip on={filtroTreino === 'revisao'} onClick={() => setFiltroTreino('revisao')}>Revisões<Count n={revisoesPendentes} /></Chip>
          </div>
          {treinosFiltrados.length === 0 ? <Vazio>Nenhum treino neste filtro.</Vazio> : (
            <div className="space-y-2">
              {treinosFiltrados.map((t) => (
                <Card key={t.id} className="bg-card/60 border-border/40">
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.nome || 'Treino'} · {nomeAluno(t.aluno_id)}</p>
                      <p className="text-xs text-muted-foreground">{t.data_inicio} → {t.data_fim || '—'} · {ativosComExec.has(t.id) ? 'aderindo' : 'sem execução recente'}</p>
                    </div>
                    {filtroTreino !== 'inativos' && <Button size="sm" variant="outline" className="shrink-0" onClick={() => setRevisao(t)}>Revisar</Button>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-3">
          <div className="flex gap-2">
            {[30, 90, 365].map((d) => <Chip key={d} on={periodo === d} onClick={() => setPeriodo(d)}>{d} dias</Chip>)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              ['Aulas', hist.aulas], ['Alunos atendidos', hist.alunos], ['Frequência média', freqMedia],
              ['Treinos criados', hist.criados], ['Treinos revisados', hist.revisados],
            ].map(([l, v]) => (
              <Card key={l as string} className="bg-card/60 border-border/40"><CardContent className="p-3">
                <p className="text-[11px] text-muted-foreground">{l}</p><p className="text-xl font-display">{v}</p>
              </CardContent></Card>
            ))}
          </div>
          {feedbacks.length > 0 && (
            <Card className="bg-card/60 border-border/40"><CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold">Feedbacks recentes</h3>
              {feedbacks.slice(0, 5).map((f: any) => (
                <p key={f.aluno_id + f.data} className="text-sm"><span className="font-medium">{nomeAluno(f.aluno_id)}</span> <span className="text-muted-foreground">· {f.feedback}</span></p>
              ))}
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Lista de presença */}
      <Dialog open={!!presencaAula} onOpenChange={(o) => !o && setPresencaAula(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Presença — {presencaAula?.nome}</DialogTitle></DialogHeader>
          {inscritos.length === 0 ? <Vazio>Nenhum inscrito nesta aula.</Vazio> : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {inscritos.map((i) => (
                <div key={i.id} className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-sm">{nomeAluno(i.aluno_id)}</span>
                  {presentes.has(i.aluno_id) ? <Badge>Presente</Badge> : (
                    <Button size="sm" variant="outline" onClick={() => marcarPresenca(i.aluno_id)}><UserCheck className="w-3 h-3 mr-1" />Marcar</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Anamnese somente leitura */}
      <Dialog open={!!anamneseView} onOpenChange={(o) => !o && setAnamneseView(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Anamnese — {anamneseView?.alunos?.nome}</DialogTitle></DialogHeader>
          <dl className="space-y-2 text-sm">
            {Object.entries((anamneseView?.respostas || {}) as Record<string, any>).map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</dt><dd>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd></div>
            ))}
            {!anamneseView?.respostas && <Vazio>Sem respostas registradas.</Vazio>}
          </dl>
        </DialogContent>
      </Dialog>

      {/* Revisão */}
      <Dialog open={!!revisao} onOpenChange={(o) => { if (!o) { setRevisao(null); setMotivo(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revisar treino de {revisao && nomeAluno(revisao.aluno_id)}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Uma nova versão será criada. A versão atual fica no histórico.</p>
          <Textarea placeholder="Motivo da revisão (obrigatório)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <DialogFooter><Button onClick={salvarRevisao}>Salvar e notificar aluno</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PersonaLayout>
  );
}
