import { PageShell } from '@/components/warroom/PageShell';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useBusinessEngine } from '@/hooks/useBusinessEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, AlertTriangle, Users, XCircle } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  agendada_ok: { label: 'OK', color: 'bg-green-500', icon: CheckCircle },
  agendada_sem_inst: { label: 'Sem Instrutor', color: 'bg-destructive', icon: AlertTriangle },
  agendada_lotada: { label: 'Lotada', color: 'bg-amber-500', icon: Users },
  agendada_vazia: { label: 'Vazia', color: 'bg-muted-foreground', icon: XCircle },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-500', icon: Calendar },
  concluida: { label: 'Concluída', color: 'bg-green-700', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-muted-foreground', icon: XCircle },
};

export function AgendaSemanal() {
  const { alunos, pagamentos, checkins, aulas, leads, experimentais } = useDataIntegration();
  const engine = useBusinessEngine({ alunos, pagamentos, checkins, aulas, leads, experimentais });

  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(inicioSemana, i);
    return { date: d, str: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE dd/MM', { locale: ptBR }) };
  });

  const aulasPorDia = diasSemana.map(dia => ({
    ...dia,
    aulas: engine.aulas.filter(a => a.data === dia.str),
  }));

  const totalSemana = engine.aulas.filter(a => diasSemana.some(d => d.str === a.data)).length;
  const semInstrutor = engine.aulas.filter(a => a.estado === 'agendada_sem_inst' && diasSemana.some(d => d.str === a.data)).length;
  const lotadas = engine.aulas.filter(a => a.estado === 'agendada_lotada' && diasSemana.some(d => d.str === a.data)).length;

  const shellMetrics = [
    { label: 'SEMANA', value: String(totalSemana) },
    { label: 'SEM INSTRUTOR', value: String(semInstrutor), color: semInstrutor > 0 ? 'text-destructive' : undefined },
    { label: 'LOTADAS', value: String(lotadas), color: lotadas > 0 ? 'text-[hsl(var(--urgency-attention))]' : undefined },
  ];

  return (
    <PageShell title="AGENDA SEMANAL" sub={`Semana de ${format(inicioSemana, "dd/MM", { locale: ptBR })}`} metrics={shellMetrics}>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {aulasPorDia.map(dia => {
          const isHoje = dia.str === format(hoje, 'yyyy-MM-dd');
          return (
            <div key={dia.str} className={`space-y-1.5 ${isHoje ? 'ring-2 ring-primary/30 rounded-md p-2' : 'p-2'}`}>
              <p className={`text-[10px] font-mono font-bold tracking-wider text-center uppercase ${isHoje ? 'text-primary' : 'text-muted-foreground'}`}>
                {dia.label}
              </p>
              {dia.aulas.length === 0 ? (
                <div className="h-16 flex items-center justify-center">
                  <p className="text-[9px] text-muted-foreground font-mono">—</p>
                </div>
              ) : (
                dia.aulas.map(aula => {
                  const cfg = ESTADO_CONFIG[aula.estado] || ESTADO_CONFIG.agendada_ok;
                  const Icon = cfg.icon;
                  return (
                    <Card key={aula.id} className="overflow-hidden">
                      <CardContent className="p-2 space-y-1">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${cfg.color} shrink-0`} />
                          <p className="text-[10px] font-medium truncate">{aula.nome}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-muted-foreground">{aula.horario?.slice(0, 5)}</span>
                          <Badge variant="outline" className="text-[8px] h-4 px-1">{aula.ocupacaoPct.toFixed(0)}%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}