import type { FleetMode } from "@/lib/data/fleet-repo";
import { cn } from "@/lib/utils";

type OpsTone = "default" | "attention";

const eyebrowTone: Record<OpsTone, string> = {
  default: "text-muted-foreground",
  attention: "text-attention",
};

/**
 * Small-caps data label. It belongs directly above a value (stat cells, table
 * heads, empty-state status) where it names what the number is.
 *
 * It is NOT a section heading. Use OpsSectionHeader for that, which renders a
 * real h2. An eyebrow standing in for a heading leaves the page with no
 * typographic hierarchy and no landmark structure.
 */
export function OpsEyebrow({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: OpsTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-label font-mono font-medium tracking-[0.14em] uppercase",
        eyebrowTone[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Shared table-head treatment. Single source for every admin table. */
export const opsTableHeadClass =
  "font-mono text-label font-medium uppercase tracking-[0.14em] text-muted-foreground";

/**
 * Hairline between data atoms. Replaces the middle-dot glyph, which reads as
 * punctuation inside data and stacks up into visual noise when repeated.
 */
export function OpsRule({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-border inline-block h-3 w-px shrink-0 self-center",
        className
      )}
    />
  );
}

/**
 * Demo vs live. Filled dot = live, hollow = demo.
 *
 * Deliberately not colored: amber is reserved for unpaid/hold urgency, and a
 * second hue would break the monochrome system. The word carries the state too,
 * so this never depends on shape alone. `border` (inset) rather than `ring`
 * (outset) keeps both states at exactly 6px.
 */
export function OpsModeIndicator({
  mode,
  className,
}: {
  mode: FleetMode;
  className?: string;
}) {
  const live = mode === "live";
  return (
    <span
      className={cn(
        "text-muted-foreground text-label flex items-center gap-1.5 font-mono font-medium tracking-[0.14em] uppercase",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          live ? "bg-foreground" : "border border-current bg-transparent"
        )}
      />
      {live ? "Live" : "Demo"}
    </span>
  );
}

/**
 * Section heading. The h2 is a real heading; `meta` carries the qualifier that
 * used to be dot-joined into the title, and `count` sits outside the h2 so the
 * accessible heading name stays stable as data changes.
 *
 * Pair with `<section aria-labelledby={id}>` so the heading becomes a landmark.
 */
export function OpsSectionHeader({
  id,
  title,
  meta,
  count,
  tone = "default",
  description,
  actions,
}: {
  id?: string;
  title: string;
  meta?: string;
  count?: number;
  tone?: OpsTone;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <h2 id={id} className="text-heading font-semibold tracking-tight">
            {title}
          </h2>
          {count !== undefined ? (
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                tone === "attention" && count > 0
                  ? "text-attention"
                  : "text-muted-foreground"
              )}
            >
              {count}
            </span>
          ) : null}
          {meta ? (
            <>
              <OpsRule />
              <OpsEyebrow>{meta}</OpsEyebrow>
            </>
          ) : null}
        </div>
        {description ? (
          <p className="text-muted-foreground max-w-[68ch] text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
