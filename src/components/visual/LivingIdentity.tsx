import type { ReactNode } from "react";
import { MoveUpRight } from "lucide-react";
export function LivingMark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`nl-mark ${small ? "nl-mark-small" : ""}`}
      aria-hidden="true"
    >
      9<span />
    </span>
  );
}
export function LivingArtwork() {
  return (
    <div className="nl-artwork" aria-hidden="true">
      <div className="nl-artwork-grid" />
      <div className="nl-artwork-orbit orbit-one" />
      <div className="nl-artwork-orbit orbit-two" />
      <div className="nl-artwork-disc">
        <MoveUpRight strokeWidth={1} />
      </div>
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  tone = "ink",
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  tone?: "ink" | "paper";
  compact?: boolean;
}) {
  return (
    <header
      className={`nl-intro ${tone === "ink" ? "nl-intro-ink" : "nl-intro-paper"} ${compact ? "nl-intro-compact" : ""}`}
    >
      <div className="nl-intro-copy">
        <p className="nl-eyebrow">
          <span className="nl-eyebrow-line" />
          {eyebrow}
        </p>
        <h1 className="nl-display">{title}</h1>
        {description && <p className="nl-intro-description">{description}</p>}
        {actions && <div className="nl-intro-actions">{actions}</div>}
      </div>
      {!compact && <LivingArtwork />}
    </header>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="nl-section-heading">
      <div>
        {eyebrow && <p className="nl-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
