import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw, Sparkles, Inbox, ArrowRight } from 'lucide-react';

/** Cabeçalho de seção padronizado */
export function SectionHeader({
  title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Card de KPI com comparativo e contexto */
export function KpiCard({
  label, value, hint, trend, tone = 'default', icon: Icon, onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: number | null;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
  icon?: any;
  onClick?: () => void;
}) {
  const toneCls =
    tone === 'positive' ? 'text-emerald-400'
      : tone === 'warning' ? 'text-amber-400'
        : tone === 'critical' ? 'text-destructive'
          : 'text-foreground';
  return (
    <Card
      className={`bg-card/60 border-border/40 ${onClick ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
        <p className={`text-xl font-semibold mt-1.5 font-display ${toneCls}`}>{value}</p>
        {(hint || typeof trend === 'number') && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {typeof trend === 'number' && (
              <span className={trend >= 0 ? 'text-emerald-400' : 'text-destructive'}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%{' '}
              </span>
            )}
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Skeleton padrão de dashboard */
export function DashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-52 w-full rounded-lg" />
    </div>
  );
}

/** Estado de erro com retry */
export function DashboardError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-8 text-center">
      <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-3" />
      <p className="text-sm font-medium">Não foi possível carregar os indicadores</p>
      <p className="text-xs text-muted-foreground mt-1 break-words">{message || 'Erro desconhecido'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Tentar novamente
        </Button>
      )}
    </div>
  );
}

/** Estado vazio acionável */
export function DashboardEmpty({
  title = 'Nada por aqui ainda',
  message,
  actionLabel,
  onAction,
}: { title?: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="border border-dashed border-border/50 rounded-lg p-8 text-center">
      <Inbox className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm font-medium">{title}</p>
      {message && <p className="text-xs text-muted-foreground mt-1">{message}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

export type QuickAction = { label: string; icon?: any; onClick: () => void };

/** Barra de ações rápidas */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (!actions.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => {
        const I = a.icon;
        return (
          <Button key={a.label} variant="outline" size="sm" onClick={a.onClick} className="text-xs">
            {I && <I className="w-3.5 h-3.5 mr-1.5" />}{a.label}
          </Button>
        );
      })}
    </div>
  );
}

export type Insight = {
  text: string;
  tone?: 'info' | 'warning' | 'positive';
  actionLabel?: string;
  onAction?: () => void;
};

/** IA como consultor: frases acionáveis geradas a partir dos indicadores */
export function AIAdvisor({ insights, title = 'Consultor 9FIT' }: { insights: Insight[]; title?: string }) {
  if (!insights.length) return null;
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</span>
        </div>
        <ul className="space-y-2.5">
          {insights.map((i, idx) => (
            <li key={idx} className="flex items-start justify-between gap-3">
              <span className={`text-sm ${
                i.tone === 'warning' ? 'text-amber-400'
                  : i.tone === 'positive' ? 'text-emerald-400' : 'text-foreground/90'
              }`}>
                {i.text}
              </span>
              {i.actionLabel && i.onAction && (
                <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs text-primary" onClick={i.onAction}>
                  {i.actionLabel} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
