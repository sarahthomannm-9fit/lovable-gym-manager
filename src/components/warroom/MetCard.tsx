import { cn } from "@/lib/utils";

interface MetCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function MetCard({ label, value, sub, color }: MetCardProps) {
  return (
    <div className="nl-metric flex flex-col gap-2">
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        {label}
      </div>
      <div className={cn("nl-metric-value", color || "text-navy")}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
