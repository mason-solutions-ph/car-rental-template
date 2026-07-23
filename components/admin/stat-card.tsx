import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminStatCard({
  label,
  value,
  hint,
  href,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  className?: string;
}) {
  const body = (
    <Card
      className={cn(
        href && "transition-colors hover:bg-muted/40",
        className
      )}
    >
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        {hint ? (
          <p className="text-muted-foreground text-xs tabular-nums">{hint}</p>
        ) : null}
      </CardHeader>
    </Card>
  );

  if (!href) return body;

  return (
    <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  );
}
