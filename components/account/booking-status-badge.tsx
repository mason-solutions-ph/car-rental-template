import { Badge } from "@/components/ui/badge";
import type { BookingStatus, PaymentStatus } from "@/types";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const variant =
    status === "confirmed" || status === "active"
      ? "default"
      : status === "cancelled"
        ? "destructive"
        : "secondary";
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const variant =
    status === "paid"
      ? "default"
      : status === "failed" || status === "expired"
        ? "destructive"
        : "outline";
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}
