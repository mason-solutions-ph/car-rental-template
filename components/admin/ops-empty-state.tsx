import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/**
 * The single empty treatment for the console.
 *
 * The title keeps the mono-uppercase label style, which is the one place that
 * treatment legitimately stands alone: in an empty state the title IS a status
 * readout ("Queue clear", "No cars yet"), not a heading.
 */
export function OpsEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("rounded-md border border-dashed p-8", className)}>
      <EmptyHeader>
        <EmptyTitle className="text-label font-mono font-medium tracking-[0.14em] uppercase">
          {title}
        </EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action}
    </Empty>
  );
}
