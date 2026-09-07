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
    supabase.from('health_day_events').select('id, title, starts_at, location, description')
      .eq('organization_id', activeOrg.id).eq('status', 'published').order('starts_at')
      .then(({ data }) => setEvents(data || []));
  }, [activeOrg]);
  return <PersonaLayout title="Agenda" accent="#1B6E6E">
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center gap-2 mb-5"><CalendarDays className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Próximos eventos do condomínio</p></div>
      {!events.length && <Card className="border-border/40"><CardContent className="p-10 text-center"><p className="font-serif text-xl">Ainda não há eventos</p><p className="text-sm text-muted-foreground mt-2">Quando um evento for publicado, ele aparecerá aqui.</p></CardContent></Card>}
      {events.map(event => <Card key={event.id} className="border-border/40 border-l-2 border-l-primary"><CardContent className="p-4 flex gap-4"><div className="w-12 text-center border-r border-border/40 pr-3"><div className="font-serif text-2xl">{new Date(event.starts_at).getDate()}</div><div className="text-[10px] uppercase text-muted-foreground">{new Date(event.starts_at).toLocaleDateString('pt-BR',{month:'short'})}</div></div><div><h2 className="font-semibold">{event.title}</h2><p className="text-sm text-muted-foreground mt-1">{new Date(event.starts_at).toLocaleString('pt-BR')} · {event.location || 'Local a confirmar'}</p></div></CardContent></Card>)}
    </div>
  </PersonaLayout>;
}