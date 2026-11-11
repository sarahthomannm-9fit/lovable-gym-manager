import { ReactNode } from "react";
import { MetCard } from "./MetCard";

interface MetricDef {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

interface PageShellProps {
  title: string;
  sub?: string;
  criticals?: number;
  metrics?: MetricDef[];
  actions?: ReactNode;
  children: ReactNode;
  noPad?: boolean;
}

export function PageShell({
  title,
  sub,
  criticals,
  metrics,
  actions,
  children,
  noPad,
}: PageShellProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top Bar */}
      <div className="nl-admin-header flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="nl-eyebrow mb-3 text-primary">Nine Living · Gestão</p>
          <h1 className="font-display text-3xl tracking-tight text-foreground">
            {title}
          </h1>
          {sub && (
            <div className="text-sm text-muted-foreground mt-2">{sub}</div>
          )}
        </div>
        {criticals != null && criticals > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-destructive/20 border border-destructive/40 text-[11px] font-mono text-red-300 shrink-0">
            ▲ {criticals} CRÍTICOS
          </div>
        )}
        {actions}
        <div className="text-[10px] font-semibold tracking-wider text-muted-foreground shrink-0">
          {new Date()
            .toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              weekday: "short",
              day: "2-digit",
              month: "short",
            })
            .toUpperCase()}
        </div>
      </div>

      {/* Metrics Bar */}
      {metrics && metrics.length > 0 && (
        <div className="px-4 sm:px-7 py-5">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
            }}
          >
            {metrics.map((m, i) => (
              <MetCard
                key={i}
                label={m.label}
                value={m.value}
                sub={m.sub}
                color={m.color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-auto ${noPad ? "" : "p-4 sm:p-6"}`}>
        {children}
      </div>
    </div>
  );
}
