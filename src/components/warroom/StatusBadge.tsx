import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  label: string;
  variant?: 'critical' | 'attention' | 'opportunity' | 'info' | 'purple' | 'muted' | 'navy';
}

const variantStyles: Record<string, string> = {
  critical: 'text-urgency-critical bg-urgency-critical-bg border-urgency-critical-border',
  attention: 'text-urgency-attention bg-urgency-attention-bg border-urgency-attention-border',
  opportunity: 'text-urgency-opportunity bg-urgency-opportunity-bg border-urgency-opportunity-border',
  info: 'text-urgency-info bg-urgency-info-bg border-urgency-info-border',
  purple: 'text-urgency-purple bg-urgency-purple-bg border-urgency-purple-border',
  muted: 'text-muted-foreground bg-muted border-border',
  navy: 'text-navy bg-muted border-border',
};

export function StatusBadge({ label, variant = 'muted' }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wide whitespace-nowrap border",
      variantStyles[variant]
    )}>
      {label}
    </span>
  );
}
