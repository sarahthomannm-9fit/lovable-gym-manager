import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, UserCheck, Dumbbell, History } from 'lucide-react';
import { toast } from 'sonner';

const ACCENT = '#C8FF00';

export default function CoachHome() {
  const { activeOrg } = useOperationalContext();
  const [aulasHoje, setAulasHoje] = useState<any[]>([]);
  const [aulasSemana, setAulasSemana] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [treinos, setTreinos] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [marcando, setMarcando] = useState<string | null>(null);

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

    const { data: tr } = await supabase.from('treinos')
      .select('id, descricao, data_inicio, data_fim, aluno_id')
      .order('data_inicio', { ascending: false }).limit(20);
    setTreinos(tr || []);

    const seteAtras = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data: hi } = await supabase.from('checkins')
      .select('id, aluno_id, data_checkin, horario_entrada')
      .gte('data_checkin', seteAtras).order('horario_entrada', { ascending: false }).limit(30);
    setHistorico(hi || []);
  };

  useEffect(() => { carregar(); }, [activeOrg]);

  const marcarPresenca = async (alunoId: string, nome: string) => {
    setMarcando(alunoId);
    const { error } = await supabase.from('checkins').insert({
      aluno_id: alunoId, data_checkin: new Date().toISOString().slice(0, 10),
    });
    setMarcando(null);
    if (error) toast.error('Falha ao registrar presença');
    else { toast.success(`Presença de ${nome} registrada`); carregar(); }
  };

  const nomeAluno = (id: string) => alunos.find(a => a.id === id)?.nome || id.slice(0, 6);

  return (
    <PersonaLayout title="Meu dia" accent={ACCENT}>
      <Tabs defaultValue="hoje">
        <TabsList className="mb-4">
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="agenda">Agenda 7d</TabsTrigger>
          <TabsTrigger value="alunos">Meus alunos</TabsTrigger>
          <TabsTrigger value="treinos">Treinos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

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
                    <Badge variant="outline" className="border-[#C8FF00]/40 text-[#C8FF00]">Em curso</Badge>
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
                          className="shrink-0 border-[#C8FF00]/40 text-[#C8FF00] hover:bg-[#C8FF00]/10">
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
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Dumbbell className="w-4 h-4" /> Treinos prescritos
          </h2>
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
      </Tabs>
    </PersonaLayout>
  );
}
