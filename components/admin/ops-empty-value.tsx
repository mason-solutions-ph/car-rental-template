import { EMPTY_VALUE } from "@/lib/format/empty";
import { cn } from "@/lib/utils";

/**
 * Placeholder for an absent value in a table cell or detail row.
 *
 * The glyph and the label are separate elements on purpose: aria-label on a
 * bare span is unreliable across screen readers, so the visible `--` is hidden
 * from the accessibility tree and a real label is exposed instead. Always pass
 * a label that says what is missing ("No car"), not a generic "empty".
 */
export function OpsEmptyValue({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground font-mono text-xs tabular-nums",
        className
      )}
    >
      <span aria-hidden>{EMPTY_VALUE}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
