import { Link } from 'react-router-dom';
import { localDate } from '@/lib/workout';
import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays } from 'lucide-react';

export default function MoradorAgenda() {
  const { activeOrg } = useOperationalContext();
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    if (!activeOrg) return;
    (supabase as any).from('eventos_condominio').select('id, nome, data_evento, horario_inicio, local, descricao')
      .eq('organization_id', activeOrg.id).eq('status', 'publicado').eq('ativo', true).gte('data_evento',localDate()).order('data_evento')
      .then(({ data }) => setEvents(data || []));
  }, [activeOrg]);
  return <PersonaLayout title="Agenda" accent="#2563EB">
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center gap-2 mb-5"><CalendarDays className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Próximos eventos do condomínio</p></div>
      {!events.length && <Card className="border-border/40"><CardContent className="p-10 text-center"><p className="font-serif text-xl">Ainda não há eventos</p><p className="text-sm text-muted-foreground mt-2">Quando um evento for publicado, ele aparecerá aqui.</p></CardContent></Card>}
      {events.map(event => <Card key={event.id} className="border-border/40 border-l-2 border-l-primary"><CardContent className="p-4 flex gap-4"><div className="w-12 text-center border-r border-border/40 pr-3"><div className="font-serif text-2xl">{Number(event.data_evento.slice(8, 10))}</div><div className="text-[10px] uppercase text-muted-foreground">{new Date(`${event.data_evento}T12:00:00`).toLocaleDateString('pt-BR',{month:'short'})}</div></div><div><h2 className="font-semibold">{event.nome}</h2><p className="text-sm text-muted-foreground mt-1">{event.data_evento} · {event.horario_inicio?.slice(0, 5)} · {event.local || 'Local a confirmar'}</p><Link className="inline-block mt-2 underline text-primary" to={'/morador/eventos?event='+encodeURIComponent(event.id)}>Ver evento e inscrições</Link></div></CardContent></Card>)}
    </div>
  </PersonaLayout>;
}
