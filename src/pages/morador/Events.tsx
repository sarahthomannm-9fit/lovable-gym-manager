import { useEffect, useState } from 'react';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Events() {
  const { activeOrg } = useOperationalContext();
  const [events, setEvents] = useState<any[]>([]);
  const [alunoId, setAlunoId] = useState('');
  useEffect(() => { (async () => { const { data: u } = await supabase.auth.getUser(); if (!u.user) return; const { data: a } = await (supabase as any).from('alunos').select('id, organization_id').eq('user_id', u.user.id).maybeSingle(); if (!a) return; setAlunoId(a.id); const { data } = await (supabase as any).from('health_day_events').select('*').eq('organization_id', activeOrg?.id || a.organization_id).eq('status', 'publicado').order('inicio'); setEvents(data || []); })(); }, [activeOrg?.id]);
  const checkin = async (id: string) => { const { error } = await (supabase as any).rpc('checkin_health_day', { p_event_id: id, p_aluno_id: alunoId }); if (error) toast.error(error.message); else toast.success('Check-in realizado.'); };\n  const register = async (id: string) => { const { data, error } = await (supabase as any).rpc('register_health_day', { p_event_id: id, p_aluno_id: alunoId }); if (error) toast.error(error.message); else toast.success(data?.status === 'lista_espera' ? 'Você entrou na lista de espera.' : 'Inscrição confirmada.'); };
  return <div className="min-h-full bg-background p-6 space-y-6"><div><h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Eventos</h1><p className="text-sm text-muted-foreground">Participe dos eventos de saúde do seu condomínio.</p></div><div className="grid gap-4">{events.map((event) => <Card key={event.id} className="rounded-sm shadow-elegant"><CardHeader><CardTitle>{event.nome}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{event.descricao || 'Evento Nine Living'}</p><p className="text-sm">{new Date(event.inicio).toLocaleString('pt-BR')} · {event.capacidade} vagas</p><div className="flex gap-2"><Button onClick={() => register(event.id)} disabled={!alunoId}>Inscrever-me</Button><Button variant="outline" onClick={() => checkin(event.id)} disabled={!alunoId}>Fazer check-in</Button></div></CardContent></Card>)}{!events.length && <p className="text-muted-foreground">Nenhum evento publicado.</p>}</div></div>;
}

