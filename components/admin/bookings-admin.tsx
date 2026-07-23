"use client";

import { useState } from "react";
import Link from "next/link";
import { BookingManageForm } from "@/components/admin/booking-manage-form";
import { OpsPageHeader, OpsSectionHeader } from "@/components/admin/ops-chrome";
import {
  OpsBookingStatusBadge,
  OpsPaymentStatusBadge,
} from "@/components/admin/ops-status-badge";
import { UnpaidBookingsQueue } from "@/components/admin/unpaid-bookings-queue";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminBookingListItem } from "@/lib/admin/queries";
import {
  BOOKING_STATUSES,
  CHECKOUT_HOLD_MINUTES,
  PAYMENT_STATUSES,
} from "@/lib/constants";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import type { BookingStatus, PaymentStatus } from "@/types";

const headClass =
  "font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

export function BookingsAdmin({
  rows,
  unpaidQueue,
  filters,
  initialBookingId = null,
}: {
  rows: AdminBookingListItem[];
  unpaidQueue: AdminBookingListItem[];
  filters: { status?: BookingStatus; paymentStatus?: PaymentStatus };
  initialBookingId?: string | null;
}) {
  const hasFilters = Boolean(filters.status || filters.paymentStatus);
  const allForSheet = [...unpaidQueue, ...rows];
  const initialBooking =
    initialBookingId != null
      ? (allForSheet.find((b) => b.id === initialBookingId) ?? null)
      : null;

  const [selected, setSelected] = useState<AdminBookingListItem | null>(
    initialBooking
  );

  function openBooking(booking: AdminBookingListItem) {
    setSelected(booking);
  }

  function closeSheet() {
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <OpsPageHeader
        eyebrow="Bookings"
        title="Bookings"
        description="Unpaid holds first, then the full booking list with filters."
      />

      <section className="flex flex-col gap-3">
        <OpsSectionHeader
          eyebrow="Needs action"
          tone="attention"
          count={unpaidQueue.length}
          description={`Needs payment or reconcile. Checkout hold: ${CHECKOUT_HOLD_MINUTES}m.`}
        />
        <UnpaidBookingsQueue
          rows={unpaidQueue}
          onSelectBooking={openBooking}
        />
      </section>

      <section className="flex flex-col gap-3">
        <OpsSectionHeader
          eyebrow="All bookings"
          count={rows.length}
          actions={
            hasFilters ? (
              <Button asChild size="sm" variant="ghost">
                <Link href="/admin/bookings">Clear filters</Link>
              </Button>
            ) : undefined
          }
        />

        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-xl border p-3"
        >
          <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-sm">
            <span className="text-muted-foreground font-mono text-[11px] tracking-wider uppercase">
              Status
            </span>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="border-input bg-background h-9 rounded-lg border px-2.5 text-sm"
            >
              <option value="">All statuses</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-sm">
            <span className="text-muted-foreground font-mono text-[11px] tracking-wider uppercase">
              Payment
            </span>
            <select
              name="payment"
              defaultValue={filters.paymentStatus ?? ""}
              className="border-input bg-background h-9 rounded-lg border px-2.5 text-sm"
            >
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>

        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={headClass}>Reference</TableHead>
                <TableHead className={headClass}>Car</TableHead>
                <TableHead className={headClass}>Pickup</TableHead>
                <TableHead className={headClass}>Total</TableHead>
                <TableHead className={headClass}>Status</TableHead>
                <TableHead className={headClass}>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground text-sm"
                  >
                    {hasFilters
                      ? "No bookings match these filters."
                      : "No bookings yet."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => openBooking(b)}
                        className="font-mono text-[13px] font-medium underline-offset-4 hover:underline"
                      >
                        {b.reference_code}
                      </button>
                    </TableCell>
                    <TableCell>{b.car_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                      {formatDateTime(b.pickup_at)}
                    </TableCell>
                    <TableCell className="font-mono text-[13px] tabular-nums">
                      {formatMoney(b.total_cents)}
                    </TableCell>
                    <TableCell>
                      <OpsBookingStatusBadge status={b.status} />
                    </TableCell>
                    <TableCell>
                      <OpsPaymentStatusBadge status={b.payment_status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader className="border-b">
            <SheetTitle className="font-mono tracking-tight">
              {selected?.reference_code ?? "Booking"}
            </SheetTitle>
            <SheetDescription>
              Update status, notes, or reconcile payment without leaving the
              list.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {selected ? (
              <BookingManageForm
                key={selected.id}
                booking={selected}
                onSuccess={closeSheet}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
