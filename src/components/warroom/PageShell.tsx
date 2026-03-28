import { ReactNode } from 'react';
import { MetCard } from './MetCard';
import { RefreshCw } from 'lucide-react';

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

export function PageShell({ title, sub, criticals, metrics, actions, children, noPad }: PageShellProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top Bar */}
      <div className="bg-navy px-6 h-[54px] flex items-center gap-4 shrink-0 shadow-[0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold font-mono tracking-wider text-white truncate">{title}</div>
          {sub && <div className="text-[10px] text-white/45 font-mono mt-0.5 truncate">{sub}</div>}
        </div>
        {criticals != null && criticals > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-destructive/20 border border-destructive/40 text-[11px] font-mono text-red-300 shrink-0">
            ▲ {criticals} CRÍTICOS
          </div>
        )}
        {actions}
        <div className="text-[10px] font-mono text-white/35 shrink-0">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
        </div>
      </div>

      {/* Metrics Bar */}
      {metrics && metrics.length > 0 && (
        <div className="px-6 py-3 border-b border-border bg-card">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 6)}, 1fr)` }}
          >
            {metrics.map((m, i) => (
              <MetCard key={i} label={m.label} value={m.value} sub={m.sub} color={m.color} />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-auto ${noPad ? '' : 'p-6'}`}>
        {children}
      </div>
    </div>
  );
}
