import Link from "next/link";
import { HoldTimer } from "@/components/admin/hold-timer";
import { OpsEmptyState } from "@/components/admin/ops-empty-state";
import { OpsEmptyValue } from "@/components/admin/ops-empty-value";
import { OpsPanel } from "@/components/admin/ops-panel";
import { opsTableHeadClass } from "@/components/admin/ops-chrome";
import { OpsPaymentStatusBadge } from "@/components/admin/ops-status-badge";
import { ReconcilePaymentButton } from "@/components/admin/reconcile-payment-button";
import { BorderBeam } from "@/components/ui/border-beam";
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
    return <OpsEmptyState title="Queue clear" description={emptyMessage} />;
  }

  return (
    <OpsPanel className="relative">
      {/* Attention-only beam: amber tokens, never the Magic UI purple defaults. */}
      <BorderBeam
        size={80}
        duration={8}
        borderWidth={1.5}
        colorFrom="var(--attention)"
        colorTo="oklch(0.75 0.12 70)"
      />
        <Table className="text-ui">
          <TableHeader>
            <TableRow>
              <TableHead className={opsTableHeadClass}>Reference</TableHead>
              <TableHead className={opsTableHeadClass}>Car</TableHead>
              <TableHead className={opsTableHeadClass}>Created</TableHead>
              <TableHead className={opsTableHeadClass}>Hold</TableHead>
              <TableHead className={opsTableHeadClass}>Total</TableHead>
              <TableHead className={opsTableHeadClass}>Payment</TableHead>
              <TableHead className={`${opsTableHeadClass} text-right`}>
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
                        className="font-mono font-medium underline-offset-4 hover:underline"
                      >
                        {b.reference_code}
                      </button>
                    ) : (
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-mono font-medium underline-offset-4 hover:underline"
                      >
                        {b.reference_code}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.car_name ?? <OpsEmptyValue label="No car" />}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                    {formatDateTime(b.created_at)}
                  </TableCell>
                  <TableCell>
                    <HoldTimer
                      createdAt={b.created_at}
                      holdMinutes={CHECKOUT_HOLD_MINUTES}
                    />
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
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
                      <span className="text-muted-foreground text-label font-mono tracking-[0.14em] uppercase">
                        No session
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
    </OpsPanel>
  );
}
