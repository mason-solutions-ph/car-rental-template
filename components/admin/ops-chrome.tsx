import { cn } from "@/lib/utils";

type OpsTone = "default" | "attention";

const eyebrowTone: Record<OpsTone, string> = {
  default: "text-muted-foreground",
  attention: "text-attention",
};

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
        "font-mono text-[11px] font-medium tracking-[0.14em] uppercase",
        eyebrowTone[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function OpsPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <OpsEyebrow>{eyebrow}</OpsEyebrow>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function OpsSectionHeader({
  eyebrow,
  tone = "default",
  count,
  description,
  actions,
}: {
  eyebrow: string;
  tone?: OpsTone;
  count?: number;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-col gap-0.5">
        <h2 className="flex items-baseline gap-2">
          <OpsEyebrow tone={tone}>{eyebrow}</OpsEyebrow>
          {count !== undefined ? (
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums",
                tone === "attention" && count > 0
                  ? "text-attention"
                  : "text-muted-foreground"
              )}
            >
              ({count})
            </span>
          ) : null}
        </h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
