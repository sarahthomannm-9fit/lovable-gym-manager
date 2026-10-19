import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonaLayout, PersonaEmptyState } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, CalendarCheck, Activity, AlertTriangle, Megaphone } from 'lucide-react';

const db = supabase as any;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => new Date(Date.now() + n * 86400000);
const dt = (d: string, t?: string) => new Date(`${d}T${(t || '00:00').slice(0, 5)}:00`);
const hhmm = (t?: string) => (t || '').slice(0, 5);
const fmtDia = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

const Vazio = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground border border-dashed border-border/40 rounded-sm p-6 text-center">{children}</p>
);

const TIPOS: Record<string, string> = { aviso: 'Aviso', promo: 'Promo', evento: 'Evento' };
const PUBLICOS: Record<string, string> = { todos: 'Todos os alunos ativos', aula: 'Inscritos em uma aula', inativos: 'Alunos inativos' };

export default function SindicoLoop() {
  const navigate = useNavigate();
  const { activeOrg, ensureOrgForPersona, isAdmin } = useOperationalContext();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [aulas, setAulas] = useState<any[]>([]);
  const [comunicados, setComunicados] = useState<any[]>([]);
  const [comErro, setComErro] = useState('');
  const [metas, setMetas] = useState<any>({});
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [detalhe, setDetalhe] = useState<any>(null);
  const [novo, setNovo] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({ titulo: '', mensagem: '', tipo: 'aviso', publico: 'todos', aula_id: '', agendar: '', urgente: false });
  const [busy, setBusy] = useState(false);
  const [formMetas, setFormMetas] = useState({ frequencia_pct: '', novos_inscritos: '', horario_abertura: '', horario_fechamento: '', capacidade_maxima: '' });

  useEffect(() => { ensureOrgForPersona('condominio').finally(() => setReady(true)); }, []);

  const load = useCallback(async () => {
    if (!activeOrg) { setLoading(false); return; }
    const hoje = iso(new Date());
    const [al, ck, au, org, com] = await Promise.all([
      db.from('alunos').select('id,nome,email,status,planos(nome)').eq('organization_id', activeOrg.id).order('nome').limit(500),
      db.from('checkins').select('aluno_id,data_checkin,alunos!inner(organization_id)').eq('alunos.organization_id', activeOrg.id).gte('data_checkin', iso(addDays(-28))),
      db.from('aulas').select('id,nome,data_aula,horario_inicio,horario_fim,capacidade_maxima,inscritos_atual,status').eq('organization_id', activeOrg.id).gte('data_aula', hoje).lte('data_aula', iso(addDays(14))).order('data_aula').order('horario_inicio'),
      db.from('organizations').select('metadata').eq('id', activeOrg.id).maybeSingle(),
      db.rpc('list_comunicados', { p_org: activeOrg.id }),
    ]);
    setAlunos(al.data || []);
    setCheckins(ck.data || []);
    setAulas(au.data || []);
    const m = org.data?.metadata?.metas || {};
    setMetas(m);
    setFormMetas({
      frequencia_pct: m.frequencia_pct != null ? String(m.frequencia_pct) : '',
      novos_inscritos: m.novos_inscritos != null ? String(m.novos_inscritos) : '',
      horario_abertura: m.horario_abertura || '',
      horario_fechamento: m.horario_fechamento || '',
      capacidade_maxima: m.capacidade_maxima != null ? String(m.capacidade_maxima) : '',
    });
    setComErro(com.error ? 'Não foi possível carregar os comunicados.' : '');
    setComunicados(com.data || []);
    setLoading(false);
  }, [activeOrg?.id]);

  useEffect(() => { if (ready) load().catch(() => setLoading(false)); }, [ready, load]);

  const ativos = alunos.filter((a) => (a.status || 'ativo') === 'ativo');
  const ultimoCheckin = useMemo(() => {
    const m: Record<string, string> = {};
    checkins.forEach((c) => { if (!m[c.aluno_id] || c.data_checkin > m[c.aluno_id]) m[c.aluno_id] = c.data_checkin; });
    return m;
  }, [checkins]);
  const comPresenca30 = new Set(checkins.filter((c) => c.data_checkin >= iso(addDays(-28))).map((c) => c.aluno_id));
  const freq = ativos.length ? Math.round((ativos.filter((a) => comPresenca30.has(a.id)).length / ativos.length) * 100) : 0;
  const inscricoesAtivas = aulas.filter((a) => a.status !== 'cancelada').reduce((s, a) => s + (a.inscritos_atual || 0), 0);
  const proxSemana = aulas.filter((a) => a.data_aula <= iso(addDays(7)) && a.status !== 'cancelada');
  const semCheckin = ativos.filter((a) => !ultimoCheckin[a.id]).length;
  const lotadas = aulas.filter((a) => a.capacidade_maxima && (a.inscritos_atual || 0) >= a.capacidade_maxima && a.status !== 'cancelada').length;

  const semanas = [3, 2, 1, 0].map((i) => {
    const ini = iso(addDays(-(i + 1) * 7 + 1)), fim = iso(addDays(-i * 7));
    return { label: i === 0 ? 'Esta semana' : `Há ${i} sem.`, n: checkins.filter((c) => c.data_checkin >= ini && c.data_checkin <= fim).length };
  });
  const maxSem = Math.max(1, ...semanas.map((s) => s.n));

  const alunosFiltrados = alunos.filter((a) => {
    if (busca && !a.nome?.toLowerCase().includes(busca.toLowerCase())) return false;
    const st = a.status || 'ativo';
    return filtro === 'todos' ? true : filtro === 'ativos' ? st === 'ativo' : st !== 'ativo';
  });

  const conflitos = useMemo(() => {
    const s = new Set<string>();
    aulas.filter((a) => a.status !== 'cancelada').forEach((a, i, arr) => arr.slice(i + 1).forEach((b) => {
      if (a.data_aula !== b.data_aula) return;
      if (dt(a.data_aula, a.horario_inicio) < dt(b.data_aula, b.horario_fim) && dt(b.data_aula, b.horario_inicio) < dt(a.data_aula, a.horario_fim)) { s.add(a.id); s.add(b.id); }
    }));
    return s;
  }, [aulas]);
  const diasGrade = Array.from(new Set(aulas.map((a) => a.data_aula)));
  const corOcup = (a: any) => {
    if (a.status === 'cancelada') return 'border-border/40 opacity-60';
    const p = a.capacidade_maxima ? (a.inscritos_atual || 0) / a.capacidade_maxima : 0;
    return p >= 0.9 ? 'border-red-500/50 bg-red-500/5' : p >= 0.5 ? 'border-amber-500/50 bg-amber-500/5' : 'border-emerald-500/40 bg-emerald-500/5';
  };

  const validarComunicado = () => {
    if (!form.titulo.trim() || !form.mensagem.trim()) { toast.error('Título e conteúdo são obrigatórios'); return false; }
    if (form.publico === 'aula' && !form.aula_id) { toast.error('Escolha a aula'); return false; }
    if (form.agendar && new Date(form.agendar) <= new Date()) { toast.error('O agendamento precisa ser no futuro'); return false; }
    return true;
  };

  const publicar = async () => {
    if (!activeOrg) return;
    setBusy(true);
    const { data, error } = await db.rpc('publish_comunicado', {
      p_org: activeOrg.id, p_titulo: form.titulo, p_mensagem: form.mensagem, p_tipo: form.tipo,
      p_publico: form.publico, p_aula_id: form.publico === 'aula' ? form.aula_id : null,
      p_agendar: form.agendar ? new Date(form.agendar).toISOString() : null, p_urgente: form.urgente,
    });
    setBusy(false);
    if (error) return toast.error(error.message || 'Não foi possível publicar');
    toast.success(form.agendar ? 'Comunicado agendado' : `Comunicado publicado para ${data ?? 0} aluno(s)`);
    setPreview(false); setNovo(false);
    setForm({ titulo: '', mensagem: '', tipo: 'aviso', publico: 'todos', aula_id: '', agendar: '', urgente: false });
    load();
  };

  const salvarMetas = async () => {
    if (!activeOrg) return;
    const nums: [string, string][] = [['frequencia_pct', 'Frequência'], ['novos_inscritos', 'Novos inscritos'], ['capacidade_maxima', 'Capacidade máxima']];
    const out: any = {};
    for (const [k, nome] of nums) {
      const v = (formMetas as any)[k];
      if (v === '') continue;
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) return toast.error(`${nome}: informe um número maior que zero`);
      if (k === 'frequencia_pct' && n > 100) return toast.error('A meta de frequência não pode passar de 100%');
      out[k] = n;
    }
    if (formMetas.horario_abertura) out.horario_abertura = formMetas.horario_abertura;
    if (formMetas.horario_fechamento) out.horario_fechamento = formMetas.horario_fechamento;
    if (out.horario_abertura && out.horario_fechamento && out.horario_abertura >= out.horario_fechamento) return toast.error('O horário de fechamento precisa ser depois da abertura');
    if (Object.keys(out).length === 0) return toast.error('Preencha ao menos uma meta');
    setBusy(true);
    const { error } = await db.rpc('update_org_metas', { p_org: activeOrg.id, p_metas: out });
    setBusy(false);
    if (error) return toast.error(error.message || 'Não foi possível salvar');
    toast.success('Metas atualizadas');
    load();
  };

  if (!activeOrg && ready && !isAdmin) {
    return <PersonaLayout title="Painel do síndico"><PersonaEmptyState message="Você ainda não está vinculado a nenhum condomínio como síndico." /></PersonaLayout>;
  }
  if (!activeOrg) {
    return <PersonaLayout title="Painel do síndico"><PersonaEmptyState /></PersonaLayout>;
  }

  const Kpi = ({ icon: I, label, value, sub }: any) => (
    <Card className="bg-card/60 border-border/40"><CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><I className="w-3.5 h-3.5" />{label}</div>
      <p className="text-2xl font-display">{value}</p>{sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </CardContent></Card>
  );

  return (
    <PersonaLayout title="Painel do síndico">
      <Tabs defaultValue="painel">
        <TabsList className="mb-4">
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="aulas">Aulas</TabsTrigger>
          <TabsTrigger value="comunicados">Comunicados</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="painel" className="space-y-4">
          {loading ? <Vazio>Carregando…</Vazio> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Kpi icon={Users} label="Total de alunos" value={alunos.length} sub={`${ativos.length} ativos`} />
                <Kpi icon={CalendarCheck} label="Inscrições ativas" value={inscricoesAtivas} sub="próximos 14 dias" />
                <Kpi icon={Activity} label="Frequência" value={`${freq}%`} sub={metas.frequencia_pct ? `meta ${metas.frequencia_pct}%` : 'últimas 4 semanas'} />
                <Kpi icon={CalendarCheck} label="Aulas na semana" value={proxSemana.length} />
              </div>
              {(semCheckin > 0 || lotadas > 0 || conflitos.size > 0) && (
                <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="p-4 space-y-1 text-sm">
                  <p className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Alertas</p>
                  {semCheckin > 0 && <p>{semCheckin} aluno(s) ativo(s) sem presença nas últimas 4 semanas.</p>}
                  {lotadas > 0 && <p>{lotadas} aula(s) lotada(s) nos próximos 14 dias.</p>}
                  {conflitos.size > 0 && <p>{conflitos.size} aula(s) com horários sobrepostos. Veja a aba Aulas.</p>}
                </CardContent></Card>
              )}
              <Card className="bg-card/60 border-border/40"><CardContent className="p-5">
                <p className="text-sm font-semibold mb-3">Frequência das últimas 4 semanas (check-ins)</p>
                {checkins.length === 0 ? <Vazio>Nenhum check-in registrado nas últimas 4 semanas.</Vazio> : (
                  <div className="flex items-end gap-3 h-32">
                    {semanas.map((s) => (
                      <div key={s.label} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                        <span className="text-xs">{s.n}</span>
                        <div className="w-full rounded-sm bg-primary/70" style={{ height: `${Math.max(4, (s.n / maxSem) * 80)}%` }} />
                        <span className="text-[10px] text-muted-foreground">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent></Card>
              <Button variant="outline" onClick={() => navigate('/sindico/painel')}>Ver relatório executivo e Health Day</Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="alunos" className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Input className="max-w-xs" placeholder="Buscar aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
            {['todos', 'ativos', 'inativos'].map((f) => <Button key={f} size="sm" variant={filtro === f ? 'default' : 'outline'} onClick={() => setFiltro(f)} className="capitalize">{f}</Button>)}
          </div>
          {alunosFiltrados.length === 0 ? <Vazio>{alunos.length === 0 ? 'Nenhum aluno vinculado a este condomínio ainda.' : 'Nenhum aluno neste filtro.'}</Vazio> : (
            <div className="space-y-2">
              {alunosFiltrados.map((a) => (
                <Card key={a.id} className="bg-card/60 border-border/40"><CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">{a.planos?.nome || 'Sem plano'} · última participação: {ultimoCheckin[a.id] ? new Date(ultimoCheckin[a.id] + 'T12:00').toLocaleDateString('pt-BR') : '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0"><Badge variant="outline">{a.status || 'ativo'}</Badge><Button size="sm" variant="ghost" onClick={() => setDetalhe(a)}>Ver detalhes</Button></div>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aulas" className="space-y-3">
          {diasGrade.length === 0 ? <Vazio>Nenhuma aula publicada para os próximos 14 dias.</Vazio> : (
            <>
              <p className="text-xs text-muted-foreground">Cores: verde abaixo de 50% de ocupação, âmbar 50–89%, vermelho 90% ou mais. Conflito = duas aulas com horários sobrepostos no mesmo dia.</p>
              {diasGrade.map((d) => (
                <section key={d} className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground capitalize">{fmtDia(d)}</h3>
                  {aulas.filter((a) => a.data_aula === d).map((a) => (
                    <Card key={a.id} className={corOcup(a)}><CardContent className="p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0"><p className="text-sm font-medium truncate">{a.nome}</p><p className="text-xs text-muted-foreground">{hhmm(a.horario_inicio)}–{hhmm(a.horario_fim)} · {a.inscritos_atual ?? 0}/{a.capacidade_maxima ?? '—'}</p></div>
                      <div className="flex gap-1">{a.status === 'cancelada' && <Badge variant="destructive">Cancelada</Badge>}{conflitos.has(a.id) && <Badge variant="outline" className="border-amber-500 text-amber-500">Conflito de horário</Badge>}</div>
                    </CardContent></Card>
                  ))}
                </section>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="comunicados" className="space-y-3">
          <div className="flex justify-end"><Button onClick={() => setNovo(true)}><Megaphone className="w-4 h-4 mr-1" />Novo comunicado</Button></div>
          {comErro && <p className="text-sm text-destructive">{comErro}</p>}
          {comunicados.length === 0 ? <Vazio>Nenhum comunicado enviado ainda.</Vazio> : comunicados.map((c) => (
            <Card key={c.comunicado_id} className="bg-card/60 border-border/40"><CardContent className="p-4">
              <div className="flex justify-between gap-2"><p className="font-medium text-sm">{c.titulo}</p><div className="flex gap-1"><Badge variant="outline">{TIPOS[c.tipo_label] || 'Aviso'}</Badge>{c.agendada_para && new Date(c.agendada_para) > new Date() && <Badge>Agendado</Badge>}</div></div>
              <p className="text-xs text-muted-foreground">{new Date(c.criado_em).toLocaleDateString('pt-BR')} · {PUBLICOS[c.publico] || c.publico} · {c.lidos} de {c.enviados} visualizações</p>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="metas" className="space-y-3">
          <Card className="bg-card/60 border-border/40"><CardContent className="p-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Meta de frequência mensal (%)</Label><Input type="number" min="1" max="100" value={formMetas.frequencia_pct} onChange={(e) => setFormMetas({ ...formMetas, frequencia_pct: e.target.value })} /></div>
              <div><Label>Meta de novos inscritos</Label><Input type="number" min="1" value={formMetas.novos_inscritos} onChange={(e) => setFormMetas({ ...formMetas, novos_inscritos: e.target.value })} /></div>
              <div><Label>Abertura</Label><Input type="time" value={formMetas.horario_abertura} onChange={(e) => setFormMetas({ ...formMetas, horario_abertura: e.target.value })} /></div>
              <div><Label>Fechamento</Label><Input type="time" value={formMetas.horario_fechamento} onChange={(e) => setFormMetas({ ...formMetas, horario_fechamento: e.target.value })} /></div>
              <div><Label>Capacidade máxima</Label><Input type="number" min="1" value={formMetas.capacidade_maxima} onChange={(e) => setFormMetas({ ...formMetas, capacidade_maxima: e.target.value })} /></div>
            </div>
            <Button disabled={busy} onClick={salvarMetas}>Salvar metas</Button>
            {Object.keys(metas).length === 0 && <p className="text-xs text-muted-foreground">Nenhuma meta definida ainda.</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detalhe?.nome}</DialogTitle></DialogHeader>
          <p className="text-sm">E-mail: {detalhe?.email || '—'}</p>
          <p className="text-sm">Plano: {detalhe?.planos?.nome || 'Sem plano'}</p>
          <p className="text-sm">Status: {detalhe?.status || 'ativo'}</p>
          <p className="text-sm">Check-ins nas últimas 4 semanas: {checkins.filter((c) => c.aluno_id === detalhe?.id).length}</p>
        </DialogContent>
      </Dialog>

      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{preview ? 'Pré-visualização' : 'Novo comunicado'}</DialogTitle></DialogHeader>
          {preview ? (
            <div className="space-y-3">
              <Card className="bg-card/60"><CardContent className="p-4"><p className="font-medium">{form.titulo}</p><p className="text-sm mt-1 whitespace-pre-wrap">{form.mensagem}</p></CardContent></Card>
              <p className="text-xs text-muted-foreground">{TIPOS[form.tipo]} · {PUBLICOS[form.publico]} · {form.agendar ? `agendado para ${new Date(form.agendar).toLocaleString('pt-BR')}` : 'envio imediato'}{form.urgente && ' · urgente'}</p>
              <DialogFooter><Button variant="outline" onClick={() => setPreview(false)}>Voltar</Button><Button disabled={busy} onClick={publicar}>{form.agendar ? 'Agendar' : 'Publicar agora'}</Button></DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
              <div><Label>Conteúdo</Label><Textarea value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label><Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TIPOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Destinatários</Label><Select value={form.publico} onValueChange={(v) => setForm({ ...form, publico: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PUBLICOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              </div>
              {form.publico === 'aula' && (
                <div><Label>Aula</Label><Select value={form.aula_id} onValueChange={(v) => setForm({ ...form, aula_id: v })}><SelectTrigger><SelectValue placeholder="Escolha a aula" /></SelectTrigger><SelectContent>{aulas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome} · {fmtDia(a.data_aula)} {hhmm(a.horario_inicio)}</SelectItem>)}</SelectContent></Select></div>
              )}
              <div><Label>Agendar (opcional)</Label><Input type="datetime-local" value={form.agendar} onChange={(e) => setForm({ ...form, agendar: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.urgente} onChange={(e) => setForm({ ...form, urgente: e.target.checked })} />Marcar como urgente</label>
              <DialogFooter><Button onClick={() => validarComunicado() && setPreview(true)}>Pré-visualizar</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PersonaLayout>
  );
}
