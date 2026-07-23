import Link from "next/link";
import { HoldTimer } from "@/components/admin/hold-timer";
import { OpsPaymentStatusBadge } from "@/components/admin/ops-status-badge";
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

const headClass =
  "font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

export function UnpaidBookingsQueue({
  rows,
  emptyMessage = "No unpaid pending bookings.",
  onSelectBooking,
}: {
  rows: AdminBookingListItem[];
  emptyMessage?: string;
  /** When set, reference opens the manage sheet instead of navigating. */
  onSelectBooking?: (booking: AdminBookingListItem) => void;
}) {
  if (!rows.length) {
    return (
      <Empty className="border border-dashed p-6">
        <EmptyHeader>
          <EmptyTitle className="font-mono text-xs tracking-wider uppercase">
            Queue clear
          </EmptyTitle>
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
              <TableHead className={headClass}>Reference</TableHead>
              <TableHead className={headClass}>Car</TableHead>
              <TableHead className={headClass}>Created</TableHead>
              <TableHead className={headClass}>Hold</TableHead>
              <TableHead className={headClass}>Total</TableHead>
              <TableHead className={headClass}>Payment</TableHead>
              <TableHead className={`${headClass} text-right`}>
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => {
              const canReconcile = Boolean(b.paymongo_checkout_session_id);
              return (
                <TableRow key={b.id}>
                  <TableCell>
                    {onSelectBooking ? (
                      <button
                        type="button"
                        onClick={() => onSelectBooking(b)}
                        className="font-mono text-[13px] font-medium underline-offset-4 hover:underline"
                      >
                        {b.reference_code}
                      </button>
                    ) : (
                      <Link
                        href={`/admin/bookings?booking=${b.id}`}
                        className="font-mono text-[13px] font-medium underline-offset-4 hover:underline"
                      >
                        {b.reference_code}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>{b.car_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                    {formatDateTime(b.created_at)}
                  </TableCell>
                  <TableCell>
                    <HoldTimer
                      createdAt={b.created_at}
                      holdMinutes={CHECKOUT_HOLD_MINUTES}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-[13px] tabular-nums">
                    {formatMoney(b.total_cents)}
                  </TableCell>
                  <TableCell>
                    <OpsPaymentStatusBadge status={b.payment_status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {canReconcile ? (
                      <ReconcilePaymentButton
                        bookingId={b.id}
                        size="sm"
                        variant="outline"
                      />
                    ) : (
                      <span className="text-muted-foreground font-mono text-[11px] uppercase">
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
