import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CreditCard, Activity, Bell, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const ACCENT = '#F472B6';

export default function MoradorHome() {
  const { user } = useAuth();
  const [aluno, setAluno] = useState<any>(null);
  const [proximas, setProximas] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [presencas, setPresencas] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Aluno por email do auth
      const { data: a } = await supabase.from('alunos')
        .select('id, nome, status, plano_id, valor_mensalidade, data_matricula')
        .eq('email', user.email || '').maybeSingle();
      // Fallback: pega o primeiro aluno (modo preview admin)
      let al = a;
      if (!al) {
        const { data: any1 } = await supabase.from('alunos').select('*').limit(1).maybeSingle();
        al = any1;
      }
      setAluno(al);

      const hoje = new Date().toISOString().slice(0, 10);
      const proximaSemana = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const { data: aulas } = await supabase.from('aulas')
        .select('id, nome, data_aula, horario_inicio, capacidade_maxima, inscritos_atual')
        .gte('data_aula', hoje).lte('data_aula', proximaSemana)
        .order('data_aula').order('horario_inicio').limit(10);
      setProximas(aulas || []);

      if (al?.id) {
        const { data: pgs } = await supabase.from('pagamentos')
          .select('id, valor, data_vencimento, data_pagamento, status, referencia_mes')
          .eq('aluno_id', al.id).order('data_vencimento', { ascending: false }).limit(8);
        setPagamentos(pgs || []);

        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
        const { count } = await supabase.from('checkins')
          .select('id', { count: 'exact', head: true })
          .eq('aluno_id', al.id).gte('data_checkin', inicioMes);
        setPresencas(count || 0);
      }

      const { data: nf } = await supabase.from('notificacoes')
        .select('id, titulo, mensagem, created_at, prioridade')
        .order('created_at', { ascending: false }).limit(6);
      setNotifs(nf || []);
    })();
  }, [user]);

  const inscrever = async (aulaId: string, nome: string) => {
    if (!aluno?.id) return toast.error('Aluno não vinculado');
    const { error } = await supabase.from('aulas_inscritos').insert({
      aluno_id: aluno.id, aula_id: aulaId, status: 'inscrito',
    });
    if (error) toast.error('Falha ao inscrever');
    else toast.success(`Inscrito em ${nome}`);
  };

  const proxAula = proximas[0];
  const pgPendentes = pagamentos.filter(p => p.status !== 'pago').length;

  return (
    <PersonaLayout title="Meu painel" subtitle="Área do aluno" accent={ACCENT}>
      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Mini icon={Calendar} label="Próxima aula"
              value={proxAula ? `${proxAula.horario_inicio?.slice(0,5)}` : '—'}
              sub={proxAula?.nome} />
        <Mini icon={Activity} label="Presenças no mês" value={presencas} />
        <Mini icon={CreditCard} label="Pagamentos pendentes" value={pgPendentes}
              valueCls={pgPendentes ? 'text-amber-400' : 'text-emerald-400'} />
        <Mini icon={Bell} label="Avisos" value={notifs.length} />
      </div>

      <Tabs defaultValue="inicio">
        <TabsList className="mb-4">
          <TabsTrigger value="inicio">Início</TabsTrigger>
          <TabsTrigger value="aulas">Aulas</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="comunicados">Comunicados</TabsTrigger>
        </TabsList>

        <TabsContent value="inicio">
          <Card className="bg-card/60 border-border/40 mb-4">
            <CardContent className="p-5">
              <h2 className="font-semibold mb-3">Bem-vindo{aluno?.nome ? `, ${aluno.nome.split(' ')[0]}` : ''}</h2>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Status: <span className="text-foreground uppercase">{aluno?.status || '—'}</span></p>
                <p>Mensalidade: <span className="text-foreground">R$ {Number(aluno?.valor_mensalidade || 0).toFixed(2)}</span></p>
                <p>Desde: <span className="text-foreground">{aluno?.data_matricula || '—'}</span></p>
              </div>
            </CardContent>
          </Card>
          <h3 className="text-sm uppercase text-muted-foreground tracking-wide mb-2">Próximas aulas</h3>
          <ListaAulas aulas={proximas.slice(0, 5)} onInscrever={inscrever} accent={ACCENT} />
        </TabsContent>

        <TabsContent value="aulas">
          <ListaAulas aulas={proximas} onInscrever={inscrever} accent={ACCENT} />
        </TabsContent>

        <TabsContent value="pagamentos">
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
        </TabsContent>

        <TabsContent value="comunicados">
          {notifs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aviso recente.</p>
          ) : (
            <div className="space-y-2">
              {notifs.map(n => (
                <Card key={n.id} className="bg-card/60 border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="font-medium text-sm">{n.titulo}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.mensagem}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PersonaLayout>
  );
}

function ListaAulas({ aulas, onInscrever, accent }: any) {
  if (aulas.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma aula nos próximos dias.</p>;
  return (
    <div className="space-y-2">
      {aulas.map((a: any) => (
        <Card key={a.id} className="bg-card/60 border-border/40">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{a.nome}</p>
              <p className="text-xs text-muted-foreground">
                {a.data_aula} • {a.horario_inicio?.slice(0, 5)} • {a.inscritos_atual ?? 0}/{a.capacidade_maxima ?? '—'}
              </p>
            </div>
            <Button size="sm" onClick={() => onInscrever(a.id, a.nome)}
                    style={{ backgroundColor: accent, color: '#000' }}
                    className="hover:opacity-90 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Inscrever
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Mini({ icon: Icon, label, value, sub, valueCls }: any) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <div className={`text-lg font-semibold ${valueCls || ''}`}>{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}
