import { cn } from "@/lib/utils";

/**
 * The single container treatment for the admin console. Replaces the four that
 * used to do this job: Card (whose ring reads as a different edge, and which
 * every admin site had to fight with py-0 + CardContent p-0), a bare border, a
 * divide-y border, and a dashed border.
 *
 * Deliberately minimal. No header slot: section headers live outside the panel,
 * which is what lets a header render in the static shell while its panel
 * streams. No padding prop: tables and divided lists supply their own.
 */
export function OpsPanel({
  className,
  tone = "solid",
  divided = false,
  ...props
}: React.ComponentProps<"div"> & {
  tone?: "solid" | "dashed";
  divided?: boolean;
}) {
  return (
    <div
      data-slot="ops-panel"
      className={cn(
        "overflow-hidden rounded-md border",
        tone === "solid" ? "bg-card" : "border-dashed",
        divided && "divide-y",
        className
      )}
      {...props}
    />
  );
}
