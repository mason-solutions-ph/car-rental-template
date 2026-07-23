import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookingStatus, PaymentStatus } from "@/types";

const bookingTone: Record<BookingStatus, string> = {
  pending: "text-attention",
  confirmed: "text-foreground",
  active: "text-foreground",
  completed: "text-muted-foreground",
  cancelled: "text-destructive",
};

const paymentTone: Record<PaymentStatus, string> = {
  unpaid: "text-attention",
  paid: "text-foreground",
  failed: "text-destructive",
  expired: "text-destructive",
  refunded: "text-muted-foreground",
};

function OpsBadge({ tone, label }: { tone: string; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-mono text-[10px] tracking-wider uppercase", tone)}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

export function OpsBookingStatusBadge({ status }: { status: BookingStatus }) {
  return <OpsBadge tone={bookingTone[status]} label={status} />;
}

export function OpsPaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <OpsBadge tone={paymentTone[status]} label={status} />;
}
