import { cn } from '@/lib/utils';

interface MetCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function MetCard({ label, value, sub, color }: MetCardProps) {
  return (
    <div className="bg-card border border-border px-4 py-3 flex flex-col gap-1">
      <div className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">
        {label}
      </div>
      <div className={cn(
        "text-2xl font-bold font-mono leading-none",
        color || "text-navy"
      )}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground font-mono">{sub}</div>}
    </div>
  );
}
