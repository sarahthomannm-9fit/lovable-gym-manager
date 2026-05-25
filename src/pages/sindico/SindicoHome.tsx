import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Inbox, LifeBuoy, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

const ACCENT = '#60A5FA';

type Inad = { id: string; nome: string; valor: number; dias: number };
type Aula = { id: string; nome: string; horario_inicio: string; capacidade: number; inscritos: number; professor: string };
type Ticket = { id: string; message: string; status: string; created_at: string; agent_response: string | null };

export default function SindicoHome() {
  const { activeOrg } = useOperationalContext();
  const [metrics, setMetrics] = useState({ alunos: 0, receita: 0, inadCount: 0, ocupacao: 0 });
  const [inad, setInad] = useState<Inad[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  const iniciais = (activeOrg?.nome || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const carregar = async () => {
    if (!activeOrg) return;
    const hoje = new Date().toISOString().slice(0, 10);
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    // Alunos da org
    const { data: alunosOrg } = await supabase
      .from('alunos').select('id, nome').eq('organization_id', activeOrg.id);
    const alunoIds = (alunosOrg || []).map(a => a.id);
    const alunoMap = Object.fromEntries((alunosOrg || []).map(a => [a.id, a.nome]));

    // Receita do mês
    let receita = 0;
    if (alunoIds.length) {
      const { data: pagos } = await supabase
        .from('pagamentos').select('valor')
        .in('aluno_id', alunoIds).eq('status', 'pago')
        .gte('data_pagamento', inicioMes);
      receita = (pagos || []).reduce((s, p: any) => s + Number(p.valor || 0), 0);
    }

    // Inadimplentes
    let inadList: Inad[] = [];
    if (alunoIds.length) {
      const { data: atrasados } = await supabase
        .from('pagamentos').select('id, aluno_id, valor, data_vencimento')
        .in('aluno_id', alunoIds).eq('status', 'atrasado')
        .order('data_vencimento', { ascending: true }).limit(5);
      inadList = (atrasados || []).map((p: any) => {
        const dias = Math.max(0, Math.floor((Date.now() - new Date(p.data_vencimento).getTime()) / 86400000));
        return { id: p.id, nome: alunoMap[p.aluno_id] || 'Aluno', valor: Number(p.valor), dias };
      });
    }

    // Aulas hoje
    const { data: aulasHoje } = await supabase
      .from('aulas')
      .select('id, nome, horario_inicio, capacidade_maxima, inscritos_atual, professor_id')
      .eq('data_aula', hoje).order('horario_inicio');
    const profIds = [...new Set((aulasHoje || []).map((a: any) => a.professor_id).filter(Boolean))];
    const { data: profs } = profIds.length
      ? await supabase.from('funcionarios').select('id, nome').in('id', profIds)
      : { data: [] as any };
    const profMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p.nome]));
    const aulasList: Aula[] = (aulasHoje || []).map((a: any) => ({
      id: a.id, nome: a.nome, horario_inicio: a.horario_inicio,
      capacidade: a.capacidade_maxima || 0, inscritos: a.inscritos_atual || 0,
      professor: profMap[a.professor_id] || '—',
    }));

    // Ocupação média 7d
    const seteDias = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data: aulas7 } = await supabase.from('aulas')
      .select('capacidade_maxima, inscritos_atual')
      .gte('data_aula', seteDias).lte('data_aula', hoje);
    const ocup = (aulas7 || []).filter((a: any) => a.capacidade_maxima > 0);
    const ocupacao = ocup.length
      ? Math.round(ocup.reduce((s: number, a: any) => s + (a.inscritos_atual / a.capacidade_maxima), 0) / ocup.length * 100)
      : 0;

    setMetrics({ alunos: alunoIds.length, receita, inadCount: inadList.length, ocupacao });
    setInad(inadList);
    setAulas(aulasList);

    // Tickets
    const { data: tk } = await supabase
      .from('support_tickets')
      .select('id, message, status, created_at, agent_response')
      .ilike('message', `[${activeOrg.nome}]%`)
      .order('created_at', { ascending: false }).limit(15);
    setTickets(tk || []);
  };

  useEffect(() => { carregar(); }, [activeOrg]);

  const solicitarCobranca = async (i: Inad) => {
    if (!activeOrg) return;
    const { error } = await supabase.from('support_tickets').insert({
      message: `[${activeOrg.nome}] Solicitar cobrança de ${i.nome} — R$ ${i.valor.toFixed(2)} vencido há ${i.dias} dias`,
      category: 'cobranca',
    });
    if (error) return toast.error('Falha ao enviar');
    toast.success(`Cobrança de ${i.nome} solicitada à equipe 9FIT`);
    carregar();
  };

  const enviarSolicitacao = async () => {
    if (!mensagem.trim() || !activeOrg) return toast.error('Escreva uma mensagem');
    setEnviando(true);
    const { error } = await supabase.from('support_tickets').insert({
      message: `[${activeOrg.nome}] ${mensagem}`, category: 'condominio',
    });
    setEnviando(false);
    if (error) return toast.error('Falha ao enviar');
    toast.success('Solicitação enviada');
    setMensagem('');
    carregar();
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

  const statusSaude = metrics.inadCount > 10 ? { txt: '⚠ Atenção', cls: 'text-amber-400' }
    : { txt: '✓ Saudável', cls: 'text-emerald-400' };

  return (
    <PersonaLayout title="Painel do Síndico" accent={ACCENT}>
      {/* Header organização */}
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

      {/* Métricas 2x2 / 4 col */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Receita do Mês" value={`R$ ${metrics.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
        <MetricCard label="Inadimplência" value={`${metrics.inadCount} pessoa${metrics.inadCount !== 1 ? 's' : ''}`} />
        <MetricCard label="Ocupação Média" value={metrics.ocupacao ? `${metrics.ocupacao}%` : '--'} />
        <MetricCard label="Status" value={statusSaude.txt} valueCls={statusSaude.cls} />
      </div>

      {/* Inadimplentes */}
      <Card className="bg-card/60 border-border/40 mb-4">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide">Inadimplentes (Ação Necessária)</h2>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          {inad.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum inadimplente. 🎉</p>
          ) : (
            <ul className="divide-y divide-border/30">
              {inad.map(i => (
                <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{i.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      Vencido há {i.dias} dias • R$ {i.valor.toFixed(2)}
                    </div>
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

      {/* Aulas hoje */}
      <Card className="bg-card/60 border-border/40 mb-4">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide">Aulas Hoje</h2>
            <span className="text-xs text-muted-foreground">{aulas.length} turma{aulas.length !== 1 ? 's' : ''}</span>
          </div>
          {aulas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem aulas agendadas para hoje.</p>
          ) : (
            <ul className="divide-y divide-border/30">
              {aulas.map(a => {
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

      {/* Solicitação livre */}
      <Card className="bg-card/60 border-border/40 mb-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <LifeBuoy className="w-4 h-4" style={{ color: ACCENT }} />
            <h2 className="font-semibold">Falar com a equipe 9FIT</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Qualquer ação operacional (troca de professor, evento, ajuste de aula) — descreva e nós cuidamos.
          </p>
          <Textarea value={mensagem} onChange={e => setMensagem(e.target.value)}
                    placeholder="Ex.: Aula de pilates de terça precisa mudar de horário…"
                    className="mb-3" rows={4} />
          <Button onClick={enviarSolicitacao} disabled={enviando}
                  className="bg-[#60A5FA] text-black hover:bg-[#60A5FA]/90">
            <MessageSquarePlus className="w-4 h-4 mr-1" />
            {enviando ? 'Enviando…' : 'Enviar solicitação'}
          </Button>
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Inbox className="w-4 h-4" style={{ color: ACCENT }} />
            <h2 className="font-semibold">Minhas solicitações</h2>
            <Badge variant="outline" className="ml-auto">{tickets.length}</Badge>
          </div>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação enviada ainda.</p>
          ) : (
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
