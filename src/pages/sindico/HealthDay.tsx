import { useEffect, useState } from 'react';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type EventRow = { id: string; nome: string; descricao: string | null; data_evento: string; horario_inicio: string; horario_fim: string | null; vagas_totais: number; status: string; inscritos?: number; espera?: number; checkins?: number };

export default function HealthDay() {
  const { activeOrg } = useOperationalContext();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: 'Health Day', descricao: '', inicio: '', fim: '', capacidade: '15' });
  const load = async () => { if (!activeOrg) return; setLoading(true); const { data, error } = await (supabase as any).from('eventos_condominio').select('*').eq('organization_id', activeOrg.id).order('data_evento', { ascending: true }); if (error) { setLoading(false); return toast.error(error.message); } const rows = await Promise.all((data || []).map(async (event: EventRow) => { const { data: registrations, error: regError } = await (supabase as any).from('health_day_inscricoes').select('status').eq('evento_id', event.id); if (regError) toast.error(regError.message); const list = registrations || []; return { ...event, inscritos: list.filter((r: any) => ['confirmado','checkin'].includes(r.status)).length, espera: list.filter((r: any) => r.status === 'lista_espera').length, checkins: list.filter((r: any) => r.status === 'checkin').length }; })); setEvents(rows); setLoading(false); };
  useEffect(() => { load(); }, [activeOrg?.id]);
  const create = async () => {
    if (!activeOrg) return toast.error('Selecione um condomínio antes de criar o evento.');
    if (!form.nome.trim() || !form.inicio || !form.fim) return toast.error('Informe nome, início e fim.');
    const inicio = new Date(form.inicio);
    const fim = new Date(form.fim);
    const capacidade = Number(form.capacidade);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) return toast.error('O fim deve ser depois do início.');
    if (form.inicio.slice(0, 10) !== form.fim.slice(0, 10)) return toast.error('O Health Day deve começar e terminar no mesmo dia.');
    if (!Number.isInteger(capacidade) || capacidade < 1) return toast.error('Informe uma capacidade válida.');
    const { error } = await (supabase as any).from('eventos_condominio').insert({ organization_id: activeOrg.id, nome: form.nome.trim(), descricao: form.descricao.trim() || null, data_evento: form.inicio.slice(0, 10), horario_inicio: form.inicio.slice(11, 16), horario_fim: form.fim.slice(11, 16), vagas_totais: capacidade, status: 'rascunho', ativo: true });
    if (error) toast.error('Não foi possível criar o evento: ' + error.message); else { toast.success('Health Day criado.'); setForm({ nome: 'Health Day', descricao: '', inicio: '', fim: '', capacidade: '15' }); await load(); }
  };
  const showParticipants = async (id: string) => { const { data, error } = await (supabase as any).from('health_day_inscricoes').select('id, status, checkin_at, alunos(nome, email)').eq('evento_id', id); if (error) toast.error(error.message); else { setParticipants(data || []); setSelectedEvent(id); } };
  const exportParticipants = () => { const csv = participants.map((p: any) => [p.alunos?.nome || 'Morador', p.alunos?.email || '', p.status, p.checkin_at || ''].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'); const blob = new Blob([`nome,email,status,checkin_at\n${csv}`], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'health-day-participantes.csv'; anchor.click(); URL.revokeObjectURL(url); };
  const updateRegistration = async (id: string, status: string) => { const { error } = await (supabase as any).rpc('manage_health_day_registration', { p_registration_id: id, p_status: status }); if (error) toast.error(error.message); else { toast.success('Inscrição atualizada.'); if (selectedEvent) showParticipants(selectedEvent); load(); } };
  const publish = async (id: string) => { const { error } = await (supabase as any).from('eventos_condominio').update({ status: 'publicado' }).eq('id', id).eq('organization_id', activeOrg?.id); if (error) toast.error(error.message); else { toast.success('Evento publicado.'); load(); } };
  return <div className="min-h-full bg-background p-6 space-y-6"><div><h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Health Day</h1><p className="text-sm text-muted-foreground">Crie eventos de saúde, defina vagas e acompanhe a ativação do condomínio.</p></div>
    <Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Novo evento</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div><div><Label>Vagas</Label><Input type="number" min="1" value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: e.target.value })} /></div><div><Label>Início</Label><Input type="datetime-local" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} /></div><div><Label>Fim</Label><Input type="datetime-local" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} /></div><div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div><div className="sm:col-span-2"><Button onClick={create}>Criar Health Day</Button></div></CardContent></Card>
    <div className="grid gap-4">{events.map((event) => <Card key={event.id} className="rounded-sm shadow-elegant"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-semibold">{event.nome}</h2><p className="text-sm text-muted-foreground">{event.data_evento} · {event.horario_inicio?.slice(0, 5)} · {event.vagas_totais} vagas</p><div className="flex gap-2 text-xs"><Badge variant="outline">{event.inscritos || 0} inscritos</Badge><Badge variant="outline">{event.espera || 0} espera</Badge><Badge variant="outline">{event.checkins || 0} check-ins</Badge><Badge variant="outline">{Math.max(0, event.vagas_totais - (event.inscritos || 0))} vagas restantes</Badge></div></div><div className="flex items-center gap-2"><Badge variant="outline">{event.status}</Badge><Button size="sm" variant="outline" onClick={() => showParticipants(event.id)}>Participantes</Button><Button size="sm" variant="ghost" onClick={() => { const link = `${window.location.origin}/morador/eventos?event=${event.id}`; navigator.clipboard.writeText(link); toast.success("Link do Health Day copiado."); }}>Copiar QR/link</Button>{event.status === 'rascunho' && <Button size="sm" onClick={() => publish(event.id)}>Publicar</Button>}</div></CardContent></Card>)}{loading ? <p className="text-sm text-muted-foreground">Carregando Health Days...</p> : !events.length && <p className="text-sm text-muted-foreground">Nenhum Health Day criado.</p>}{selectedEvent && <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Participantes</CardTitle><Button size="sm" variant="outline" onClick={exportParticipants}>Exportar CSV</Button></div></CardHeader><CardContent className="space-y-2">{participants.map((p) => <div key={p.id} className="flex items-center justify-between border-b py-2 text-sm"><span>{p.alunos?.nome || 'Morador'}<span className="block text-xs text-muted-foreground">{p.alunos?.email || ''}</span></span><div className="flex items-center gap-2"><Badge variant={p.status === 'checkin' ? 'default' : 'outline'}>{p.status}</Badge>{p.status === 'lista_espera' && <Button size="sm" onClick={() => updateRegistration(p.id, 'confirmado')}>Promover</Button>}{['confirmado','lista_espera'].includes(p.status) && <Button size="sm" variant="ghost" onClick={() => updateRegistration(p.id, 'cancelado')}>Cancelar</Button>}</div></div>)}{!participants.length && <p className="text-sm text-muted-foreground">Nenhum participante.</p>}</CardContent></Card>}</div>
  </div>;
}


