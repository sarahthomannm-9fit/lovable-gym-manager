import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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


const ACCENT = '#F472B6';

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
  const [treinoAtivo, setTreinoAtivo] = useState<any>(null);
  const [exerciciosHoje, setExerciciosHoje] = useState<any[]>([]);
  const [checkinFeito, setCheckinFeito] = useState(false);
  const [salvando, setSalvando] = useState(false);

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
      const { data: aulas } = await supabase.from('aulas')
        .select('id, nome, data_aula, horario_inicio, capacidade_maxima, inscritos_atual, modalidade')
        .gte('data_aula', hoje).lte('data_aula', proximaSemana)
        .order('data_aula').order('horario_inicio').limit(10);
      if (!mounted) return;
      setProximas(aulas || []);

      if (al?.organization_id) {
        const { data: ev } = await supabase.from('eventos_condominio')
          .select('id, nome, data_evento, horario_inicio, horario_fim, local')
          .eq('organization_id', al.organization_id).eq('ativo', true)
          .gte('data_evento', hoje).order('data_evento').limit(3);
        if (mounted) setEventos(ev || []);
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

        // Treino ativo
        const { data: tr } = await supabase.from('treinos')
          .select('id, descricao, data_inicio, data_fim')
          .eq('aluno_id', al.id).gte('data_fim', hoje)
          .order('data_inicio', { ascending: false }).limit(1).maybeSingle();
        if (!mounted) return;
        setTreinoAtivo(tr);

        // Exercícios de hoje (do plano vinculado — best effort)
        if (tr) {
          const diaSemana = new Date().getDay() || 7;
          const { data: pes } = await supabase.from('plano_exercicios')
            .select('*, exercicios_biblioteca(nome, grupo_muscular, video_url)')
            .eq('dia_semana', diaSemana).order('ordem').limit(8);
          setExerciciosHoje(pes || []);
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
    const { error } = await supabase.from('aulas_inscritos').insert({
      aluno_id: aluno.id, aula_id: aulaId, status: 'inscrito',
    });
    if (error) toast.error('Falha ao inscrever');
    else toast.success(`Inscrito em ${nome}`);
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

  const concluirTreino = async () => {
    if (!aluno?.id || !treinoAtivo) return;
    setSalvando(true);
    const { error } = await supabase.from('treino_execucoes').insert({
      treino_id: treinoAtivo.id, aluno_id: aluno.id,
      data_execucao: new Date().toISOString().slice(0, 10),
      concluido: true,
    });
    setSalvando(false);
    if (error) toast.error('Falha ao registrar');
    else toast.success('Treino concluído! Parabéns 🎉');
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
                    <Button size="lg" onClick={concluirTreino} disabled={salvando}
                            style={{ backgroundColor: ACCENT, color: '#000' }}
                            className="hover:opacity-90 shrink-0 text-base px-6 h-12">
                      <PlayCircle className="w-5 h-5 mr-1.5" /> Começar
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
          {!treinoAtivo ? (
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

              <Button size="lg" onClick={concluirTreino} disabled={salvando}
                      className="w-full h-14 text-base"
                      style={{ backgroundColor: ACCENT, color: '#000' }}>
                <CheckCircle2 className="w-5 h-5 mr-2" /> Concluir treino de hoje
              </Button>
            </>
          )}
        </TabsContent>

        {/* AULAS */}
        <TabsContent value="aulas">
          {proximas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma aula nos próximos dias.</p>
          ) : (
            <div className="space-y-2">
              {proximas.map(a => (
                <Card key={a.id} className="bg-card/60 border-border/40">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.data_aula} • {a.horario_inicio?.slice(0, 5)} • {a.inscritos_atual ?? 0}/{a.capacidade_maxima ?? '—'}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => inscrever(a.id, a.nome)}
                            style={{ backgroundColor: ACCENT, color: '#000' }}
                            className="hover:opacity-90 shrink-0">
                      Inscrever
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
