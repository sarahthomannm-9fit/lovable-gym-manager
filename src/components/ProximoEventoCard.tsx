import { Card, CardContent } from '@/components/ui/card';
import { CalendarHeart } from 'lucide-react';

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

// Reusable "next event" card, used by both SindicoHome and MoradorHome — matches
// the Brandbook reference ("Próximo evento" · "Health Day de Agosto" · date + time).
// Shows the single nearest upcoming event; renders nothing if there are none, so
// callers can drop it in without an extra conditional.
export function ProximoEventoCard({ eventos, accent }: ProximoEventoCardProps) {
  if (!eventos.length) return null;
  const proximo = eventos[0];
  const data = new Date(proximo.data_evento + 'T00:00:00');
  const dataFormatada = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
             style={{ backgroundColor: `${accent}1A`, color: accent }}>
          <CalendarHeart className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Próximo evento</p>
          <p className="font-semibold truncate">{proximo.nome}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {dataFormatada}
            {proximo.horario_inicio && ` · ${proximo.horario_inicio.slice(0, 5)}`}
            {proximo.horario_fim && ` às ${proximo.horario_fim.slice(0, 5)}`}
            {proximo.local && ` · ${proximo.local}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
