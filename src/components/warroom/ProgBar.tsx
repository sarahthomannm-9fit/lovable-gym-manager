import { cn } from '@/lib/utils';

interface ProgBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
}

export function ProgBar({ value, max, color, height = 4 }: ProgBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="bg-muted rounded-sm overflow-hidden" style={{ height }}>
      <div
        className={cn("h-full rounded-sm transition-all", color || "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
