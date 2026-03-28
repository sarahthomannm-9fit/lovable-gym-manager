import { cn } from '@/lib/utils';

interface AvatarInitialsProps {
  name: string;
  size?: number;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function AvatarInitials({ name, size = 32 }: AvatarInitialsProps) {
  return (
    <div
      className="rounded-full bg-urgency-info-bg border border-urgency-info-border flex items-center justify-center font-bold text-primary font-mono shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {getInitials(name)}
    </div>
  );
}
