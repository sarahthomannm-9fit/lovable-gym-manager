import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, CreditCard, Activity, Bell, CheckCircle2,
  Dumbbell, Heart, Sparkles, MapPin, Clock, PlayCircle,
  MessageCircle, QrCode, TrendingUp, TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useAlunoVinculo } from '@/hooks/useAlunoVinculo';
import { ProximoEventoCard, type EventoCondominio } from '@/components/ProximoEventoCard';


const ACCENT = '#1B6E6E';

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Bom dia', emoji: '🌷' };
  if (h < 18) return { text: 'Boa tarde', emoji: '☀️' };
  return { text: 'Boa noite', emoji: '🌙' };
}

function dataExtenso() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export default function MoradorHome() {
  const { user } = useAuth();
  const { isAdmin } = useOperationalContext();
  const { aluno: vinculo, loading: vinculoLoading } = useAlunoVinculo();

  const [ready, setReady] = useState(false);
  const [aluno, setAluno] = useState<any>(null);
  const [proximas, setProximas] = useState<any[]>([]);
  const [eventos, setEventos] = useState<EventoCondominio[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [presencas, setPresencas] = useState(0);
  const [presencasMesAnterior, setPresencasMesAnterior] = useState<number | null>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [treinoAtivo, setTreinoAtivo] = useState<any>(null);
  const [exerciciosHoje, setExerciciosHoje] = useState<any[]>([]);
  const [checkinFeito, setCheckinFeito] = useState(false);
  const [minhasInscricoes, setMinhasInscricoes] = useState<Set<string>>(new Set());
  const [checkinsAula, setCheckinsAula] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);
  const [sessao, setSessao] = useState<any>(null);
  const [treinoErro, setTreinoErro] = useState('');
  const [feedbackTreino, setFeedbackTreino] = useState('');

  useEffect(() => {
    if (!user || vinculoLoading) return;
    let mounted = true;
    setReady(false);
    (async () => {
      let al: any = null;
      if (vinculo?.id) {
        const { data: a } = await supabase.from('alunos')
          .select('id, nome, status, plano_id, valor_mensalidade, data_matricula, organization_id')
          .eq('id', vinculo.id).maybeSingle();
        al = a;
      }
      if (!al && isAdmin) {
        const { data: any1 } = await supabase.from('alunos').select('*').limit(1).maybeSingle();
        al = any1;
      }
      if (!mounted) return;
      setAluno(al);


      const hoje = new Date().toISOString().slice(0, 10);
      const proximaSemana = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      let aulasQuery = supabase.from('aulas')
        .select('id, nome, data_aula, horario_inicio, horario_fim, capacidade_maxima, inscritos_atual, modalidade, status')
        .gte('data_aula', hoje).lte('data_aula', proximaSemana)
        .order('data_aula').order('horario_inicio').limit(30);
      // Cada morador só vê as aulas do próprio condomínio.
      if (al?.organization_id) aulasQuery = aulasQuery.eq('organization_id', al.organization_id);
      const { data: aulas } = await aulasQuery;
      if (!mounted) return;
      setProximas(aulas || []);
      if (al?.id && aulas?.length) {
        const ids = aulas.map((a: any) => a.id);
        const { data: insc } = await supabase.from('aulas_inscritos')
          .select('aula_id').eq('aluno_id', al.id).in('aula_id', ids).neq('status', 'cancelado');
        if (mounted) setMinhasInscricoes(new Set((insc || []).map((i: any) => i.aula_id)));
      }

      if (al?.organization_id) {
        const { data: ev } = await supabase.from('eventos_condominio')
          .select('id, nome, data_evento, horario_inicio, horario_fim, local')
          .eq('organization_id', al.organization_id).eq('ativo', true)
          .gte('data_evento', hoje).order('data_evento').limit(3);
        if (mounted) { setEventos(ev || []); const { data: announcementsData } = await (supabase as any).rpc('resident_announcements', { p_aluno_id: al.id }); setAnnouncements((announcementsData || []).slice(0, 5)); }
      }

      if (al?.id) {
        const { data: pgs } = await supabase.from('pagamentos')
          .select('id, valor, data_vencimento, data_pagamento, status, referencia_mes')
          .eq('aluno_id', al.id).order('data_vencimento', { ascending: false }).limit(8);
        if (!mounted) return;
        setPagamentos(pgs || []);

        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().slice(0, 10);
        const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).toISOString().slice(0, 10);
        const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0).toISOString().slice(0, 10);

        const [{ count: countAtual }, { count: countAnterior }] = await Promise.all([
          supabase.from('checkins').select('id', { count: 'exact', head: true })
            .eq('aluno_id', al.id).gte('data_checkin', inicioMes),
          supabase.from('checkins').select('id', { count: 'exact', head: true })
            .eq('aluno_id', al.id).gte('data_checkin', inicioMesAnterior).lte('data_checkin', fimMesAnterior),
        ]);
        if (!mounted) return;
        setPresencas(countAtual || 0);
        // Só mostramos a comparação percentual se o aluno já treinava no mês anterior —
        // um aluno novo (0 presenças no mês passado) não tem uma base real de comparação,
        // e "+∞%" ou "0 → N" não é uma informação honesta de evolução.
        setPresencasMesAnterior(countAnterior && countAnterior > 0 ? countAnterior : null);

        // Check-in de hoje
        const { data: ck } = await supabase.from('checkins')
          .select('id').eq('aluno_id', al.id).eq('data_checkin', hoje).maybeSingle();
        setCheckinFeito(!!ck);

        // A mesma função do servidor resolve vigência, plano, semana, dia e sessão.
        const { data: workout, error: workoutError } = await (supabase as any).rpc('student_workout') as { data: any; error: any };
        if (!mounted) return;
        if (workoutError) {
          setTreinoErro('Não foi possível carregar o treino de hoje.');
          setTreinoAtivo(null); setExerciciosHoje([]); setSessao(null);
        } else {
          setTreinoErro('');
          setTreinoAtivo(workout?.treino || null);
          setExerciciosHoje(workout?.exercicios || []);
          setSessao(workout?.session || null);
        }
      }

      let nf: any[] | null = [];
      if (al?.id) {
        const { data } = await supabase.from('notificacoes')
          .select('id, titulo, mensagem, created_at, prioridade')
          .eq('destinatario_id', al.id)
          .order('created_at', { ascending: false }).limit(6);
        nf = data;
      }
      if (!mounted) return;
      setNotifs(nf || []);
      setReady(true);
    })().catch(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, [user?.id, vinculo?.id, vinculoLoading, isAdmin]);

  const inscrever = async (aulaId: string, nome: string) => {
    if (!aluno?.id) return toast.error('Aluno não vinculado');
    const aula = proximas.find(a => a.id === aulaId);
    if (aula?.status === 'cancelada') return toast.error('Esta aula foi cancelada');
    if (minhasInscricoes.has(aulaId)) return toast.info('Você já está inscrito nesta aula');
    if (aula && aula.capacidade_maxima != null && (aula.inscritos_atual ?? 0) >= aula.capacidade_maxima) return toast.error('Aula lotada');
    const { error } = await supabase.from('aulas_inscritos').insert({
      aluno_id: aluno.id, aula_id: aulaId, status: 'inscrito',
    });
    if (error) toast.error('Falha ao inscrever');
    else { toast.success(`Inscrito em ${nome}`); setMinhasInscricoes(prev => new Set(prev).add(aulaId)); }
  };

  const inicioAula = (a: any) => new Date(`${a.data_aula}T${(a.horario_inicio || '00:00').slice(0, 5)}:00`);
  const fimAula = (a: any) => new Date(`${a.data_aula}T${(a.horario_fim || a.horario_inicio || '23:59').slice(0, 5)}:00`);
  // Check-in da aula: aberto de 15 min antes do início até o fim da aula; só para inscritos, nunca em aula cancelada.
  const motivoSemCheckin = (a: any): string | null => {
    if (a.status === 'cancelada') return 'Aula cancelada';
    if (!minhasInscricoes.has(a.id)) return 'Inscreva-se primeiro';
    if (checkinsAula.has(a.id)) return 'Check-in feito';
    const agora = Date.now();
    if (agora > fimAula(a).getTime()) return 'Aula já passou';
    if (agora < inicioAula(a).getTime() - 15 * 60000) return `Abre às ${new Date(inicioAula(a).getTime() - 15 * 60000).toTimeString().slice(0, 5)}`;
    return null;
  };
  const checkinNaAula = async (a: any) => {
    const motivo = motivoSemCheckin(a);
    if (motivo) return toast.error(motivo);
    if (!aluno?.id) return toast.error('Aluno não vinculado');
    setSalvando(true);
    const { error } = await supabase.from('checkins').insert({
      aluno_id: aluno.id, data_checkin: a.data_aula, horario_entrada: new Date().toISOString(),
    });
    setSalvando(false);
    if (error) return toast.error('Falha no check-in');
    setCheckinsAula(prev => new Set(prev).add(a.id));
    if (a.data_aula === new Date().toISOString().slice(0, 10)) { setCheckinFeito(true); setPresencas(p => p + 1); }
    toast.success(`Presença confirmada em ${a.nome}`);
  };

  const fazerCheckin = async () => {
    if (!aluno?.id) return toast.error('Aluno não vinculado');
    setSalvando(true);
    const { error } = await supabase.from('checkins').insert({
      aluno_id: aluno.id,
      data_checkin: new Date().toISOString().slice(0, 10),
      horario_entrada: new Date().toISOString(),
    });
    setSalvando(false);
    if (error) toast.error('Falha no check-in');
    else { setCheckinFeito(true); toast.success('Check-in registrado! Bom treino 💪'); setPresencas(p => p + 1); }
  };

  const atualizarSessao = async (action: 'start' | 'pause' | 'resume' | 'finish', progress = sessao?.progress || {}, feedback = sessao?.feedback || '') => {
    if (!treinoAtivo) return;
    setSalvando(true);
    const { data, error } = await (supabase as any).rpc('save_workout_session', {
      p_treino_id: treinoAtivo.id, p_action: action, p_progress: progress, p_feedback: feedback,
    });
    setSalvando(false);
    if (error) toast.error(error.message || 'Falha ao registrar sessão');
    else { setSessao(data); if (action === 'finish') toast.success('Treino concluído! Parabéns 🎉'); }
  };

  const iniciarTreino = () => atualizarSessao(sessao?.status === 'pausado' ? 'resume' : 'start');
  const concluirTreino = () => {
    const progress = Object.fromEntries(exerciciosHoje.map((ex: any) => [ex.id, { completed: true, carga: ex.carga_kg == null ? '' : String(ex.carga_kg) }]));
    return atualizarSessao('finish', progress, feedbackTreino);
  };

  const s = saudacao();
  const nomeCurto = aluno?.nome?.split(' ')[0] || '';
  const proxAula = proximas[0];
  const pgPendentes = pagamentos.filter(p => p.status !== 'pago').length;
  const variacaoPercentual = presencasMesAnterior
    ? Math.round(((presencas - presencasMesAnterior) / presencasMesAnterior) * 100)
    : null;

  if (!ready) {
    return (
      <PersonaLayout title="Meu painel" subtitle="Área do aluno" accent={ACCENT}>
        <div className="min-h-[320px] flex items-center justify-center text-sm text-muted-foreground">Carregando…</div>
      </PersonaLayout>
    );
  }

  if (!aluno) {
    return (
      <PersonaLayout title="Meu painel" subtitle="Área do aluno" accent={ACCENT}>
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-5 text-sm text-muted-foreground">
            Nenhum aluno vinculado a este e-mail. Peça ao administrador para associar seu cadastro.
          </CardContent>
        </Card>
      </PersonaLayout>
    );
  }

  return (
    <PersonaLayout title="Meu painel" subtitle="Área do aluno" accent={ACCENT}>
      <Tabs defaultValue="hoje">
        <TabsList className="mb-6">
          <TabsTrigger value="hoje" className="text-base px-6">Hoje</TabsTrigger>
          <TabsTrigger value="treino">Meu treino</TabsTrigger>
          <TabsTrigger value="aulas">Aulas</TabsTrigger>
          <TabsTrigger value="suporte">Suporte</TabsTrigger>
          <TabsTrigger value="mais">Mais</TabsTrigger>
        </TabsList>

        {/* HOJE — foco em simplicidade sênior */}
        <TabsContent value="hoje" className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold mb-1">
              {s.text}, {nomeCurto} {s.emoji}
            </h1>
            <p className="text-base text-muted-foreground capitalize">{dataExtenso()}</p>
          </div>

          {/* Bloco principal: Hoje você pode... */}
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Hoje você pode…
            </h2>
            <div className="space-y-3">
              {/* Treino */}
              {treinoAtivo && (
                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold">Fazer seu treino</p>
                      <p className="text-sm text-muted-foreground truncate">{treinoAtivo.descricao || 'Plano personalizado'}</p>
                    </div>
                    <Button size="lg" onClick={iniciarTreino} disabled={salvando || sessao?.status === 'concluido'}
                            style={{ backgroundColor: ACCENT, color: '#FFFFFF' }}
                            className="hover:opacity-90 shrink-0 text-base px-6 h-12">
                      <PlayCircle className="w-5 h-5 mr-1.5" /> {sessao?.status === 'pausado' ? 'Retomar' : sessao?.status === 'em_andamento' ? 'Em andamento' : 'Começar'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Aula do dia */}
              {proxAula && proxAula.data_aula === new Date().toISOString().slice(0, 10) && (
                <Card className="bg-card/60 border-border/40">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/15 flex items-center justify-center shrink-0">
                      <Calendar className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold truncate">{proxAula.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        às {proxAula.horario_inicio?.slice(0, 5)}
                        {proxAula.modalidade && ` · ${proxAula.modalidade}`}
                      </p>
                    </div>
                    <Button size="lg" variant="outline" onClick={() => inscrever(proxAula.id, proxAula.nome)}
                            className="shrink-0 text-base h-12">
                      Participar
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Check-in */}
              <Card className={`${checkinFeito ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-card/60 border-border/40'}`}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${checkinFeito ? 'bg-emerald-500/20' : 'bg-amber-500/15'}`}>
                    {checkinFeito ? <Heart className="w-7 h-7 text-emerald-400" /> : <QrCode className="w-7 h-7 text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold">
                      {checkinFeito ? 'Presença registrada hoje ✓' : 'Fazer check-in de hoje'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {checkinFeito ? 'Continue com essa constância!' : 'Confirme que você veio treinar'}
                    </p>
                  </div>
                  {!checkinFeito && (
                    <Button size="lg" onClick={fazerCheckin} disabled={salvando}
                            className="shrink-0 text-base h-12 bg-amber-500 hover:bg-amber-600 text-black">
                      <CheckCircle2 className="w-5 h-5 mr-1.5" /> Check-in
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sua evolução */}
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Sua evolução
            </h2>
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold">{presencas}</p>
                  <p className="text-sm text-muted-foreground">
                    {presencas === 1 ? 'treino' : 'treinos'} este mês
                  </p>
                </div>
                {variacaoPercentual !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold ${
                    variacaoPercentual >= 0
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {variacaoPercentual >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {variacaoPercentual >= 0 ? '+' : ''}{variacaoPercentual}%
                    <span className="font-normal text-xs opacity-80">vs. mês anterior</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Próximo evento do condomínio */}
          {announcements.length > 0 && <div><h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Comunicados do condomínio</h2><div className="space-y-2">{announcements.map((item: any) => <Card key={item.id} className="bg-card/60 border-border/40"><CardContent className="p-4"><p className="font-medium">{item.titulo}</p><p className="text-sm text-muted-foreground mt-1">{item.mensagem}</p></CardContent></Card>)}</div></div>}

          {eventos.length > 0 && (
            <div>
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Próximo evento
              </h2>
              <ProximoEventoCard eventos={eventos} accent={ACCENT} />
            </div>
          )}

          {/* Próximas atividades do condomínio */}
          {proximas.length > 0 && (
            <div>
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Próximas atividades no condomínio
              </h2>
              <div className="space-y-2">
                {proximas.slice(0, 2).map(a => (
                  <Card key={a.id} className="bg-card/60 border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{a.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(a.data_aula).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                          {' · '}{a.horario_inicio?.slice(0, 5)}
                          {a.modalidade && <> · <MapPin className="w-3 h-3 inline" /> {a.modalidade}</>}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Frase motivacional */}
          {presencas > 0 && (
            <Card className="bg-card/40 border-border/30">
              <CardContent className="p-5 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Você treinou <span className="text-foreground font-semibold">{presencas} {presencas === 1 ? 'vez' : 'vezes'}</span> este mês.
                  {presencas >= 8 && ' Que consistência incrível!'}
                  {presencas >= 3 && presencas < 8 && ' Continue assim!'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* MEU TREINO */}
        <TabsContent value="treino" className="space-y-4">
          {treinoErro ? (
            <Card className="border-destructive/40"><CardContent className="p-6 text-sm text-destructive">{treinoErro}<Button className="ml-3" size="sm" variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button></CardContent></Card>
          ) : !treinoAtivo ? (
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-8 text-center space-y-3">
                <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/50" />
                <p className="font-medium">Nenhum treino ativo</p>
                <p className="text-sm text-muted-foreground">
                  Peça ao seu coach para preparar um plano personalizado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-wider text-primary mb-1">Seu plano</p>
                  <h2 className="text-xl font-semibold mb-2">{treinoAtivo.descricao || 'Plano personalizado'}</h2>
                  <p className="text-sm text-muted-foreground">
                    De {new Date(treinoAtivo.data_inicio).toLocaleDateString('pt-BR')} até {new Date(treinoAtivo.data_fim).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>

              <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Exercícios de hoje</h3>
              {exerciciosHoje.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem exercícios programados para hoje. Aproveite para descansar 🌿</p>
              ) : (
                <div className="space-y-2">
                  {exerciciosHoje.map(ex => (
                    <Card key={ex.id} className="bg-card/60 border-border/40">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-mono text-sm shrink-0">
                          {ex.ordem}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ex.exercicios_biblioteca?.nome || 'Exercício'}</p>
                          <p className="text-xs text-muted-foreground">
                            {ex.series} séries × {ex.repeticoes}
                            {ex.carga_kg && ` · ${ex.carga_kg}kg`}
                            {ex.descanso_seg && ` · descanso ${ex.descanso_seg}s`}
                          </p>
                        </div>
                        {ex.exercicios_biblioteca?.video_url && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={ex.exercicios_biblioteca.video_url} target="_blank" rel="noreferrer">
                              <PlayCircle className="w-5 h-5" />
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {sessao?.status === 'em_andamento' && <Button size="lg" variant="outline" onClick={() => atualizarSessao('pause')} disabled={salvando} className="w-full h-12">Pausar treino</Button>}
              <Textarea value={feedbackTreino} onChange={(e) => setFeedbackTreino(e.target.value)} placeholder="Como foi o treino? Dor, dificuldade ou observação (opcional)" className="min-h-20" />
              <Button size="lg" onClick={sessao?.status === 'concluido' ? undefined : concluirTreino} disabled={salvando || sessao?.status === 'concluido'}
                      className="w-full h-14 text-base"
                      style={{ backgroundColor: ACCENT, color: '#000' }}>
                <CheckCircle2 className="w-5 h-5 mr-2" /> {sessao?.status === 'concluido' ? 'Treino concluído hoje' : 'Concluir treino de hoje'}
              </Button>
            </>
          )}
        </TabsContent>

        {/* AULAS */}
        <TabsContent value="aulas">
          {proximas.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-dashed border-border/40 rounded-sm p-6 text-center">Nenhuma aula publicada para os próximos 7 dias neste condomínio.</p>
          ) : (
            <div className="space-y-2">
              {proximas.map(a => {
                const cancelada = a.status === 'cancelada';
                const inscrito = minhasInscricoes.has(a.id);
                const lotada = !cancelada && a.capacidade_maxima != null && (a.inscritos_atual ?? 0) >= a.capacidade_maxima;
                const semCheckin = motivoSemCheckin(a);
                return (
                  <Card key={a.id} className="bg-card/60 border-border/40">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{a.nome}</p>
                          {cancelada && <Badge variant="destructive">Cancelada</Badge>}
                          {!cancelada && inscrito && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40" variant="outline">Inscrito</Badge>}
                          {lotada && !inscrito && <Badge variant="outline">Lotado</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(`${a.data_aula}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} • {a.horario_inicio?.slice(0, 5)}–{a.horario_fim?.slice(0, 5)} • {a.inscritos_atual ?? 0}/{a.capacidade_maxima ?? '—'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0 items-end">
                        {!inscrito && !cancelada && (
                          <Button size="sm" onClick={() => inscrever(a.id, a.nome)} disabled={lotada}
                                  style={{ backgroundColor: ACCENT, color: '#000' }} className="hover:opacity-90">
                            {lotada ? 'Lotado' : 'Inscrever'}
                          </Button>
                        )}
                        {inscrito && (
                          <Button size="sm" variant="outline" onClick={() => checkinNaAula(a)} disabled={!!semCheckin || salvando} title={semCheckin || 'Confirmar presença'}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {semCheckin ?? 'Fazer check-in'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suporte" className="space-y-4">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Falar com o professor</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Canal direto para dúvidas sobre treino, dor, ajuste de carga ou plantão do condomínio.
                  </p>
                </div>
              </div>
              <Button asChild variant="premium" className="w-full">
                <a href={`https://wa.me/?text=${encodeURIComponent('Olá, professor 9FIT. Preciso de suporte no meu treino.')}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Perguntas frequentes</h3>
              {[
                ['Como faço check-in?', 'Na aba Aulas, inscreva-se e use "Fazer check-in" a partir de 15 minutos antes da aula. Também há o check-in do dia na aba Hoje.'],
                ['Quando meu treino fica disponível?', 'Depois que o coach recebe sua anamnese e cria o plano. Você será avisado nos comunicados.'],
                ['Como vejo meus pagamentos?', 'Na aba Mais, em Pagamentos, com plano, valor e vencimento.'],
              ].map(([q, r]) => (
                <details key={q} className="text-sm border-b border-border/30 pb-2">
                  <summary className="cursor-pointer font-medium">{q}</summary>
                  <p className="text-muted-foreground mt-1">{r}</p>
                </details>
              ))}
            </CardContent>
          </Card>

          {notifs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" /> Comunicados recentes
              </h3>
              {notifs.slice(0, 3).map(n => (
                <Card key={n.id} className="bg-card/60 border-border/40">
                  <CardContent className="p-4">
                    <p className="font-medium text-sm mb-1">{n.titulo}</p>
                    <p className="text-sm text-muted-foreground">{n.mensagem}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MAIS: pagamentos + notificações */}
        <TabsContent value="mais" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Mini icon={Activity} label="Presenças no mês" value={presencas} />
            <Mini icon={CreditCard} label="Pagamentos" value={pgPendentes ? `${pgPendentes} pendente${pgPendentes>1?'s':''}` : 'Em dia'}
                  valueCls={pgPendentes ? 'text-amber-400' : 'text-emerald-400'} />
          </div>

          {(() => {
            const abertos = pagamentos.filter(p => p.status !== 'pago').sort((a, b) => String(a.data_vencimento).localeCompare(String(b.data_vencimento)));
            const prox = abertos[0];
            const hojeIso = new Date().toISOString().slice(0, 10);
            const atrasado = prox && String(prox.data_vencimento) < hojeIso;
            return (
              <Card className="bg-card/60 border-border/40">
                <CardContent className="p-5 space-y-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Minha assinatura</p>
                  <p className="text-base font-semibold">
                    {aluno?.valor_mensalidade != null ? `R$ ${Number(aluno.valor_mensalidade).toFixed(2)} / mês` : 'Valor não informado'}
                  </p>
                  {prox ? (
                    <p className={`text-sm ${atrasado ? 'text-amber-400' : 'text-muted-foreground'}`}>
                      {atrasado
                        ? `Sua mensalidade de ${new Date(prox.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')} está em aberto. Se já pagou, desconsidere; caso contrário, fale com o seu coach ou a administração para regularizar.`
                        : `Próximo vencimento: ${new Date(prox.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                    </p>
                  ) : <p className="text-sm text-emerald-400">Tudo em dia.</p>}
                </CardContent>
              </Card>
            );
          })()}

          <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Pagamentos</h3>
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-0">
              {pagamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground p-5">Sem pagamentos registrados.</p>
              ) : (
                <ul className="divide-y divide-border/30">
                  {pagamentos.map(p => (
                    <li key={p.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">R$ {Number(p.valor).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          Venc. {p.data_vencimento} {p.data_pagamento && `• Pago em ${p.data_pagamento}`}
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        p.status === 'pago' ? 'border-emerald-500/40 text-emerald-400' :
                        p.status === 'atrasado' ? 'border-amber-500/40 text-amber-400' :
                        'border-border'
                      }>{p.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {notifs.length > 0 && (
            <>
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" /> Comunicados
              </h3>
              <div className="space-y-2">
                {notifs.map(n => (
                  <Card key={n.id} className="bg-card/60 border-border/40">
                    <CardContent className="p-4">
                      <p className="font-medium text-sm mb-1">{n.titulo}</p>
                      <p className="text-sm text-muted-foreground">{n.mensagem}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </PersonaLayout>
  );
}

function Mini({ icon: Icon, label, value, valueCls }: any) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <div className={`text-lg font-semibold ${valueCls || ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
