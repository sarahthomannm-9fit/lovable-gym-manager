import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Clock, MapPin } from 'lucide-react';

export interface EventoCondominio {
  id: string;
  nome: string;
  data_evento: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  local: string | null;
}

interface ProximoEventoCardProps {
  eventos: EventoCondominio[];
  accent: string;
}

function formatarData(dataISO: string) {
  const d = new Date(`${dataISO}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function ProximoEventoCard({ eventos, accent }: ProximoEventoCardProps) {
  if (!eventos || eventos.length === 0) return null;

  const [proximo, ...outros] = eventos;

  return (
    <Card className="bg-card/60 border-border/40 overflow-hidden">
      <div className="h-1" style={{ backgroundColor: accent }} />
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accent}1A`, color: accent }}
          >
            <CalendarDays className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold truncate">{proximo.nome}</p>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">
              {formatarData(proximo.data_evento)}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              {proximo.horario_inicio && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {proximo.horario_inicio.slice(0, 5)}
                  {proximo.horario_fim && ` – ${proximo.horario_fim.slice(0, 5)}`}
                </span>
              )}
              {proximo.local && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {proximo.local}
                </span>
              )}
            </div>
          </div>
        </div>

        {outros.length > 0 && (
          <ul className="mt-4 pt-4 border-t border-border/30 space-y-2">
            {outros.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{e.nome}</span>
                <span className="text-xs text-muted-foreground shrink-0 capitalize">
                  {formatarData(e.data_evento)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
