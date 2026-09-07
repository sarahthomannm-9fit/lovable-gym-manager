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
  const register = async (id: string) => { const { data, error } = await (supabase as any).rpc('register_health_day', { p_event_id: id, p_aluno_id: alunoId }); if (error) toast.error(error.message); else toast.success(data?.status === 'lista_espera' ? 'Você entrou na lista de espera.' : 'Inscrição confirmada.'); };
  return <div className="p-6 space-y-6"><div><h1 className="text-2xl font-bold">Eventos</h1><p className="text-sm text-muted-foreground">Participe dos eventos de saúde do seu condomínio.</p></div><div className="grid gap-4">{events.map((event) => <Card key={event.id}><CardHeader><CardTitle>{event.nome}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{event.descricao || 'Evento Nine Living'}</p><p className="text-sm">{new Date(event.inicio).toLocaleString('pt-BR')} · {event.capacidade} vagas</p><Button onClick={() => register(event.id)} disabled={!alunoId}>Inscrever-me</Button></CardContent></Card>)}{!events.length && <p className="text-muted-foreground">Nenhum evento publicado.</p>}</div></div>;
}

