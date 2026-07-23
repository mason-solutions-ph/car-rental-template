import Link from "next/link";
import { PaymentStatusBadge } from "@/components/account/booking-status-badge";
import { ReconcilePaymentButton } from "@/components/admin/reconcile-payment-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import type { AdminBookingListItem } from "@/lib/admin/queries";

function holdLabel(createdAt: string, now: Date): string {
  const ageMs = now.getTime() - new Date(createdAt).getTime();
  const holdMs = CHECKOUT_HOLD_MINUTES * 60 * 1000;
  const remainingMs = holdMs - ageMs;
  if (remainingMs <= 0) {
    return "Hold elapsed";
  }
  const mins = Math.ceil(remainingMs / 60_000);
  return `${mins}m left`;
}

export function UnpaidBookingsQueue({
  rows,
  emptyMessage = "No unpaid pending bookings.",
}: {
  rows: AdminBookingListItem[];
  emptyMessage?: string;
}) {
  const now = new Date();

  if (!rows.length) {
    return (
      <Empty className="border border-dashed p-6">
        <EmptyHeader>
          <EmptyTitle>Unpaid queue empty</EmptyTitle>
          <EmptyDescription>{emptyMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Car</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Hold</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((b) => {
            const canReconcile = Boolean(b.paymongo_checkout_session_id);
            return (
              <TableRow key={b.id}>
                <TableCell>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {b.reference_code}
                  </Link>
                </TableCell>
                <TableCell>{b.car_name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDateTime(b.created_at)}
                </TableCell>
                <TableCell className="text-sm">
                  {holdLabel(b.created_at, now)}
                </TableCell>
                <TableCell>{formatMoney(b.total_cents)}</TableCell>
                <TableCell>
                  <PaymentStatusBadge status={b.payment_status} />
                </TableCell>
                <TableCell className="text-right">
                  {canReconcile ? (
                    <ReconcilePaymentButton
                      bookingId={b.id}
                      size="sm"
                      variant="outline"
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      No session
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </CardContent>
    </Card>
  );
}
