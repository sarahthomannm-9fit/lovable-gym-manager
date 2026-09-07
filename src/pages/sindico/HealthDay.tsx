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

type EventRow = { id: string; nome: string; descricao: string | null; inicio: string; fim: string; capacidade: number; status: string };

export default function HealthDay() {
  const { activeOrg } = useOperationalContext();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [form, setForm] = useState({ nome: 'Health Day', descricao: '', inicio: '', fim: '', capacidade: '15' });
  const load = async () => { if (!activeOrg) return; const { data, error } = await (supabase as any).from('health_day_events').select('*').eq('organization_id', activeOrg.id).order('inicio', { ascending: true }); if (error) toast.error(error.message); else setEvents(data || []); };
  useEffect(() => { load(); }, [activeOrg?.id]);
  const create = async () => {
    if (!activeOrg || !form.inicio || !form.fim) return toast.error('Informe início e fim.');
    const { error } = await (supabase as any).from('health_day_events').insert({ organization_id: activeOrg.id, ...form, capacidade: Number(form.capacidade), inicio: new Date(form.inicio).toISOString(), fim: new Date(form.fim).toISOString() });
    if (error) toast.error(error.message); else { toast.success('Health Day criado.'); setForm({ nome: 'Health Day', descricao: '', inicio: '', fim: '', capacidade: '15' }); load(); }
  };
  const publish = async (id: string) => { const { error } = await (supabase as any).from('health_day_events').update({ status: 'publicado' }).eq('id', id); if (error) toast.error(error.message); else { toast.success('Evento publicado.'); load(); } };
  return <div className="p-6 space-y-6"><div><h1 className="text-2xl font-bold">Health Day</h1><p className="text-sm text-muted-foreground">Crie eventos de saúde, defina vagas e acompanhe a ativação do condomínio.</p></div>
    <Card><CardHeader><CardTitle>Novo evento</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div><div><Label>Vagas</Label><Input type="number" min="1" value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: e.target.value })} /></div><div><Label>Início</Label><Input type="datetime-local" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} /></div><div><Label>Fim</Label><Input type="datetime-local" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} /></div><div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div><div className="sm:col-span-2"><Button onClick={create}>Criar Health Day</Button></div></CardContent></Card>
    <div className="grid gap-4">{events.map((event) => <Card key={event.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-semibold">{event.nome}</h2><p className="text-sm text-muted-foreground">{new Date(event.inicio).toLocaleString('pt-BR')} · {event.capacidade} vagas</p></div><div className="flex items-center gap-2"><Badge variant="outline">{event.status}</Badge>{event.status === 'rascunho' && <Button size="sm" onClick={() => publish(event.id)}>Publicar</Button>}</div></CardContent></Card>)}{!events.length && <p className="text-sm text-muted-foreground">Nenhum Health Day criado.</p>}</div>
  </div>;
}

