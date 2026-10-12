import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { PageShell } from '@/components/warroom/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Class = { id: string; nome: string; data_aula: string; horario_inicio: string; status: string | null; professor_id: string | null; inscritos_atual: number | null; capacidade_maxima: number | null };
export function AgendaSemanal() {
  const navigate = useNavigate();
  const { activeOrg } = useOperationalContext();
  const [week, setWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const first = format(week, 'yyyy-MM-dd');
  const last = format(addDays(week, 6), 'yyyy-MM-dd');
  useEffect(() => {
    let mounted = true;
    if (!activeOrg?.id) { setClasses([]); return; }
    setLoading(true); setError('');
    supabase.from('aulas').select('id,nome,data_aula,horario_inicio,status,professor_id,inscritos_atual,capacidade_maxima').eq('organization_id', activeOrg.id).gte('data_aula', first).lte('data_aula', last).order('data_aula').order('horario_inicio').then(({ data, error: loadError }) => {
      if (!mounted) return;
      if (loadError) { setError(loadError.message); setClasses([]); } else setClasses((data || []) as Class[]);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [activeOrg?.id, first, last]);
  const days = Array.from({ length: 7 }, (_, index) => { const day = addDays(week, index); return { value: format(day, 'yyyy-MM-dd'), label: format(day, 'EEE dd/MM', { locale: ptBR }) }; });
  const withoutCoach = classes.filter((item) => item.status !== 'cancelada' && !item.professor_id).length;
  const full = classes.filter((item) => item.status !== 'cancelada' && Number(item.inscritos_atual || 0) >= Number(item.capacidade_maxima || 20)).length;
  return <PageShell title="AGENDA SEMANAL" sub={`Semana de ${format(week, 'dd/MM', { locale: ptBR })}`} metrics={[{ label: 'AULAS', value: String(classes.length) }, { label: 'SEM INSTRUTOR', value: String(withoutCoach) }, { label: 'LOTADAS', value: String(full) }]}>
    <div className="mb-4 flex items-center justify-between gap-3"><Button variant="outline" size="sm" onClick={() => setWeek(addWeeks(week, -1))}>Semana anterior</Button><Button variant="outline" size="sm" onClick={() => setWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Esta semana</Button><Button variant="outline" size="sm" onClick={() => setWeek(addWeeks(week, 1))}>Próxima semana</Button></div>
    {!activeOrg && <p className="text-sm text-muted-foreground">Selecione uma organização.</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{loading && <p className="text-sm text-muted-foreground">Carregando aulas…</p>}
    <div className="grid gap-2 md:grid-cols-7">{days.map((day) => <div key={day.value} className="space-y-2"><p className="text-center text-xs font-semibold uppercase">{day.label}</p>{classes.filter((item) => item.data_aula === day.value).map((item) => { const occupancy = Number(item.capacidade_maxima || 20) ? Math.round(Number(item.inscritos_atual || 0) / Number(item.capacidade_maxima || 20) * 100) : 0; return <Card key={item.id} className="cursor-pointer hover:border-primary" onClick={() => navigate(`/aulas?focus=${item.id}`)}><CardContent className="space-y-1 p-3"><p className="truncate text-sm font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{item.horario_inicio?.slice(0, 5)} · {occupancy}% ocupado</p><Badge variant="outline" className="text-[10px]">{item.status === 'cancelada' ? 'Cancelada' : !item.professor_id ? 'Sem instrutor' : occupancy >= 100 ? 'Lotada' : item.status || 'Agendada'}</Badge></CardContent></Card>; })}{!classes.some((item) => item.data_aula === day.value) && <p className="text-center text-xs text-muted-foreground">Sem aulas</p>}</div>)}</div>
  </PageShell>;
}

