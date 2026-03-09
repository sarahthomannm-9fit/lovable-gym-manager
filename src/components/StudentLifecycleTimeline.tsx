import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePessoaEventos } from '@/hooks/usePessoaEventos';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Clock, ArrowRight, Shield, Loader2 } from 'lucide-react';

const LIFECYCLE_LABELS: Record<string, string> = {
  lead: 'Lead',
  lead_aquecido: 'Lead Aquecido',
  experimental: 'Experimental',
  ativo: 'Ativo',
  recorrente: 'Recorrente',
  inativo: 'Inativo',
  ex_aluno: 'Ex-Aluno',
};

const LIFECYCLE_COLORS: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-800',
  lead_aquecido: 'bg-amber-100 text-amber-800',
  experimental: 'bg-blue-100 text-blue-800',
  ativo: 'bg-green-100 text-green-800',
  recorrente: 'bg-emerald-100 text-emerald-800',
  inativo: 'bg-red-100 text-red-800',
  ex_aluno: 'bg-gray-100 text-gray-800',
};

interface Props {
  alunoId: string;
  lifecycleStatus?: string;
}

export function StudentLifecycleTimeline({ alunoId, lifecycleStatus }: Props) {
  const { eventos, loading: eventosLoading } = usePessoaEventos(alunoId);
  const { entitlements, loading: entLoading } = useEntitlements(alunoId);

  return (
    <div className="space-y-6">
      {/* Current Lifecycle Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Status do Ciclo de Vida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            {Object.keys(LIFECYCLE_LABELS).map(status => (
              <Badge
                key={status}
                className={`${
                  lifecycleStatus === status
                    ? LIFECYCLE_COLORS[status] + ' ring-2 ring-primary ring-offset-2 font-bold'
                    : 'bg-muted text-muted-foreground opacity-40'
                } transition-all`}
              >
                {LIFECYCLE_LABELS[status]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entitlements / Acessos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Acessos (Entitlements)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando...</div>
          ) : entitlements.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum acesso vinculado</p>
          ) : (
            <div className="space-y-2">
              {entitlements.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{e.sku?.nome || 'SKU'}</p>
                    <p className="text-xs text-muted-foreground">{e.sku?.tipo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={e.status === 'ativo' ? 'default' : 'secondary'}>{e.status}</Badge>
                    {e.data_fim && <span className="text-xs text-muted-foreground">até {new Date(e.data_fim).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline de Eventos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventosLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando...</div>
          ) : eventos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum evento registrado</p>
          ) : (
            <div className="space-y-3">
              {eventos.slice(0, 20).map(ev => (
                <div key={ev.id} className="flex items-start gap-3 border-l-2 border-primary/30 pl-4 pb-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{ev.tipo_evento}</p>
                    {ev.descricao && <p className="text-xs text-muted-foreground">{ev.descricao}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
