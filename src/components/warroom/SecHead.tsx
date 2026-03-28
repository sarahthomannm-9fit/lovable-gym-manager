interface SecHeadProps {
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}

export function SecHead({ title, sub, action, onAction }: SecHeadProps) {
  return (
    <div className="flex items-end justify-between mb-3.5">
      <div>
        <div className="text-xs font-semibold font-mono tracking-wider uppercase text-navy">
          {title}
        </div>
        {sub && <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{sub}</div>}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="bg-transparent border border-border text-muted-foreground text-[10px] font-mono px-3 py-1 rounded-sm cursor-pointer hover:border-primary hover:text-primary transition-colors"
        >
          {action} →
        </button>
      )}
    </div>
  );
}
