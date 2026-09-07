import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PersonaLayout, PersonaEmptyState } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, UserCheck, Dumbbell, History, ClipboardList, Sparkles, QrCode, Megaphone, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import { CriarTreinoDialog } from '@/components/CriarTreinoDialog';

const ACCENT = '#1B6E6E';

export default function CoachHome() {
  const { activeOrg, ensureOrgForPersona, isAdmin } = useOperationalContext();
  const [ready, setReady] = useState(false);
  const [aulasHoje, setAulasHoje] = useState<any[]>([]);
  const [aulasSemana, setAulasSemana] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [treinos, setTreinos] = useState<any[]>([]);
  const [safetyByStudent, setSafetyByStudent] = useState<Record<string, string>>({});
  const [historico, setHistorico] = useState<any[]>([]);
  const [anamnesesFila, setAnamnesesFila] = useState<any[]>([]);
  const [filaIACount, setFilaIACount] = useState(0);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [aprovando, setAprovando] = useState<string | null>(null);

  useEffect(() => { ensureOrgForPersona('professor').finally(() => setReady(true)); }, []);


  const carregar = async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const seteDias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const [{ data: hj }, { data: sm }] = await Promise.all([
      supabase.from('aulas').select('id, nome, horario_inicio, horario_fim, inscritos_atual, capacidade_maxima')
        .eq('data_aula', hoje).order('horario_inicio'),
      supabase.from('aulas').select('id, nome, data_aula, horario_inicio, inscritos_atual')
        .gte('data_aula', hoje).lte('data_aula', seteDias).order('data_aula').order('horario_inicio'),
    ]);
    setAulasHoje(hj || []);
    setAulasSemana(sm || []);

    const alunosQuery = supabase.from('alunos').select('id, nome, status, valor_mensalidade').eq('status', 'ativo');
    if (activeOrg) alunosQuery.eq('organization_id', activeOrg.id);
    const { data: al } = await alunosQuery.order('nome').limit(50);
    setAlunos(al || []);
    const { data: safetyRows } = await (supabase as any).from('student_safety_onboarding').select('aluno_id, risco').in('aluno_id', (al || []).map((a: any) => a.id));
    setSafetyByStudent(Object.fromEntries((safetyRows || []).map((row: any) => [row.aluno_id, row.risco])));

    const { data: tr } = await supabase.from('treinos')
      .select('id, descricao, data_inicio, data_fim, aluno_id')
      .order('data_inicio', { ascending: false }).limit(20);
    setTreinos(tr || []);

    const seteAtras = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data: hi } = await supabase.from('checkins')
      .select('id, aluno_id, data_checkin, horario_entrada')
      .gte('data_checkin', seteAtras).order('horario_entrada', { ascending: false }).limit(30);
    setHistorico(hi || []);

    // Anamneses preenchidas sem plano de treino ativo
    const { data: an } = await supabase.from('anamnese_respostas')
      .select('id, aluno_id, tipo, preenchido_em, alunos(nome, email)')
      .eq('status', 'preenchido')
      .order('preenchido_em', { ascending: false }).limit(20);
    const alIds = (an || []).map((a: any) => a.aluno_id).filter(Boolean);
    const { data: trAtivos } = alIds.length
      ? await supabase.from('treinos').select('aluno_id').in('aluno_id', alIds).gte('data_fim', hoje)
      : { data: [] as any };
    const comTreino = new Set((trAtivos || []).map((t: any) => t.aluno_id));
    setAnamnesesFila((an || []).filter((a: any) => !comTreino.has(a.aluno_id)));

    const { count } = await supabase.from('treinos_ia_fila')
      .select('id', { count: 'exact', head: true }).eq('status', 'pendente');
    setFilaIACount(count || 0);
  };

  useEffect(() => { carregar(); }, [activeOrg]);

  if (!activeOrg && ready && !isAdmin) {
    return (
      <PersonaLayout title="Meu dia" accent={ACCENT}>
        <PersonaEmptyState message="Nenhum contexto de coach disponível." />
      </PersonaLayout>
    );
  }

  const marcarPresenca = async (alunoId: string, nome: string) => {
    setMarcando(alunoId);
    const { error } = await supabase.from('checkins').insert({
      aluno_id: alunoId, data_checkin: new Date().toISOString().slice(0, 10),
    });
    setMarcando(null);
    if (error) toast.error('Falha ao registrar presença');
    else { toast.success(`Presença de ${nome} registrada`); carregar(); }
  };

  const aprovarAnamnese = async (anamnese: any) => {
    if (!anamnese.aluno_id) return toast.error('Anamnese sem aluno vinculado');
    setAprovando(anamnese.id);
    const hoje = new Date().toISOString().slice(0, 10);
    const fim = new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);
    const nome = anamnese.alunos?.nome || 'aluno';
    const { error } = await supabase.from('treinos').insert({
      aluno_id: anamnese.aluno_id,
      organization_id: activeOrg?.id || null,
      nome: `Plano inicial 9FIT — ${nome}`,
      descricao: 'Plano gerado a partir da anamnese e aprovado pelo professor. Ajustar carga e exercícios conforme evolução do aluno.',
      data_inicio: hoje,
      data_fim: fim,
      status: 'ativo',
    });
    if (!error) {
      await supabase.from('anamnese_respostas').update({ status: 'aprovado' }).eq('id', anamnese.id);
    }
    setAprovando(null);
    if (error) return toast.error('Falha ao aprovar treino');
    toast.success(`Treino de ${nome} aprovado`);
    carregar();
  };

  const nomeAluno = (id: string) => alunos.find(a => a.id === id)?.nome || id.slice(0, 6);

  return (
    <PersonaLayout title="Meu dia" accent={ACCENT}>
      <Tabs defaultValue={anamnesesFila.length > 0 || filaIACount > 0 ? 'fila' : 'hoje'}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="fila" className="relative">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Fila
            {(anamnesesFila.length + filaIACount) > 0 && (
              <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
                {anamnesesFila.length + filaIACount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="agenda">Agenda 7d</TabsTrigger>
          <TabsTrigger value="alunos">Meus alunos</TabsTrigger><Button asChild variant="outline" size="sm" className="ml-auto"><Link to="/coach/revisoes">Revisões pendentes</Link></Button>
          <TabsTrigger value="treinos">Treinos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="space-y-4">
          <div className="flex justify-end">
            <CriarTreinoDialog
              alunos={alunos.map(a => ({ id: a.id, nome: a.nome }))}
              organizationId={activeOrg?.id}
              onCriado={carregar}
            />
          </div>
          {filaIACount > 0 && (
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{filaIACount} treino{filaIACount>1?'s':''} gerado{filaIACount>1?'s':''} pela IA aguardando aprovação</p>
                  <p className="text-xs text-muted-foreground">Revise e envie ao aluno em um clique.</p>
                </div>
                <Button size="sm" onClick={() => window.location.href = '/treinos'}
                        style={{ backgroundColor: ACCENT, color: '#FFFFFF' }}>Ver fila IA</Button>
              </CardContent>
            </Card>
          )}
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Anamneses preenchidas sem treino ({anamnesesFila.length})
          </h2>
          {anamnesesFila.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma anamnese pendente. Bom trabalho!</p>
          ) : (
            <div className="space-y-2">
              {anamnesesFila.map((a: any) => (
                <Card key={a.id} className="bg-card/60 border-border/40">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.alunos?.nome || 'Aluno'}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.tipo?.toUpperCase()} · preenchido em {new Date(a.preenchido_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button size="sm" variant="premium" disabled={aprovando === a.id} onClick={() => aprovarAnamnese(a)}>
                      {aprovando === a.id ? 'Aprovando…' : 'Aprovar em 1 clique'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hoje">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Aulas de hoje
          </h2>
          {aulasHoje.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem aulas hoje.</p>
          ) : (
            <div className="space-y-2">
              {aulasHoje.map(a => (
                <Card key={a.id} className="bg-card/60 border-border/40">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.horario_inicio?.slice(0,5)}–{a.horario_fim?.slice(0,5)} · {a.inscritos_atual ?? 0}/{a.capacidade_maxima ?? '—'}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-[#1B6E6E]/40 text-[#1B6E6E]">Em curso</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agenda">
          {aulasSemana.length === 0 ? <p className="text-sm text-muted-foreground">Sem aulas nos próximos 7 dias.</p> : (
            <div className="space-y-2">
              {aulasSemana.map(a => (
                <Card key={a.id} className="bg-card/60 border-border/40">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">{a.data_aula} · {a.horario_inicio?.slice(0,5)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{a.inscritos_atual ?? 0} inscritos</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alunos">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> Meus alunos ({alunos.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {alunos.map(al => (
              <Card key={al.id} className="bg-card/60 border-border/40">
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{al.nome}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{al.status}</p>
                  </div>
                  <Button size="sm" variant="outline" disabled={marcando === al.id}
                          onClick={() => marcarPresenca(al.id, al.nome)}
                          className="shrink-0 border-[#1B6E6E]/40 text-[#1B6E6E] hover:bg-[#1B6E6E]/10">
                    <UserCheck className="w-3 h-3 mr-1" />
                    {marcando === al.id ? '…' : 'Presença'}
                  </Button>
                </CardContent>
              </Card>
            ))}
            {alunos.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Nenhum aluno vinculado.</p>}
          </div>
        </TabsContent>

        <TabsContent value="treinos">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Treinos prescritos
            </h2>
            <CriarTreinoDialog
              alunos={alunos.map(a => ({ id: a.id, nome: a.nome }))}
              organizationId={activeOrg?.id}
              onCriado={carregar}
            />
          </div>
          {treinos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum treino criado.</p> : (
            <div className="space-y-2">
              {treinos.map(t => (
                <Card key={t.id} className="bg-card/60 border-border/40">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{nomeAluno(t.aluno_id)}</p>
                    <p className="text-xs text-muted-foreground">{t.descricao || 'Sem descrição'}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{t.data_inicio} → {t.data_fim || '—'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Presenças (7 dias)
          </h2>
          {historico.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum check-in recente.</p> : (
            <ul className="divide-y divide-border/30 border border-border/30 rounded-lg">
              {historico.map(h => (
                <li key={h.id} className="p-3 flex justify-between text-sm">
                  <span>{nomeAluno(h.aluno_id)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.horario_entrada).toLocaleString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="operacao" className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-4 flex gap-3">
                <QrCode className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">QR instalado</p>
                  <p className="text-xs text-muted-foreground">Academia, elevador e portaria quando aplicável.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-4 flex gap-3">
                <Megaphone className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Comunicado enviado</p>
                  <p className="text-xs text-muted-foreground">Grupo do condomínio com CTA para anamnese.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-4 flex gap-3">
                <FileCheck2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Plantão definido</p>
                  <p className="text-xs text-muted-foreground">Dia, horário e frequência registrados para prestação de contas.</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5">
              <h2 className="font-semibold mb-3">Roteiro de visita Rony</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                {['Estrutura física e equipamentos', 'Pesquisa de uso e horário de pico', 'Perfil do condomínio e WhatsApp oficial', 'Adesão esperada e unidades interessadas', 'Definição do primeiro plantão', 'Próximos passos: QR, comunicado e contrato'].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <ClipboardList className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PersonaLayout>
  );
}
