"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckIcon, CopyIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { BookingManageForm } from "@/components/admin/booking-manage-form";
import { OpsEmptyValue } from "@/components/admin/ops-empty-value";
import { OpsPanel } from "@/components/admin/ops-panel";
import {
  OpsSectionHeader,
  opsTableHeadClass,
} from "@/components/admin/ops-chrome";
import {
  OpsBookingStatusBadge,
  OpsPaymentStatusBadge,
} from "@/components/admin/ops-status-badge";
import { UnpaidBookingsQueue } from "@/components/admin/unpaid-bookings-queue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const selectClass =
  "border-input bg-background text-ui h-8 rounded-sm border px-2";

const fieldLabelClass =
  "text-muted-foreground text-label font-mono font-medium tracking-[0.14em] uppercase";

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

function CopyReferenceButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-7 shrink-0"
      aria-label={`Copy reference ${code}`}
      onClick={(e) => {
        e.stopPropagation();
        void copyText("Reference", code).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
    </Button>
  );
}

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
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((b) => {
      const hay = [b.reference_code, b.car_name ?? "", b.status, b.payment_status]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  function openBooking(booking: AdminBookingListItem) {
    setSelected(booking);
  }

  function closeSheet() {
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="ops-unpaid" className="flex flex-col gap-3">
        <OpsSectionHeader
          id="ops-unpaid"
          title="Needs action"
          tone="attention"
          count={unpaidQueue.length}
          description={`Needs payment or reconcile. Checkout hold: ${CHECKOUT_HOLD_MINUTES}m.`}
        />
        <UnpaidBookingsQueue
          rows={unpaidQueue}
          onSelectBooking={openBooking}
        />
      </section>

      <section aria-labelledby="ops-all-bookings" className="flex flex-col gap-3">
        <OpsSectionHeader
          id="ops-all-bookings"
          title="All bookings"
          count={filteredRows.length}
          actions={
            hasFilters ? (
              <Button asChild size="sm" variant="ghost">
                <Link href="/admin/bookings">Clear filters</Link>
              </Button>
            ) : undefined
          }
        />

        {/* Native selects, deliberately: this is a plain GET form and shadcn's
            Select is a controlled Radix widget that would need hidden inputs to
            keep submitting. Styled to match the console instead. */}
        <OpsPanel className="p-3">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[9rem] flex-1 flex-col gap-1">
              <span className={fieldLabelClass}>Status</span>
              <select
                name="status"
                defaultValue={filters.status ?? ""}
                className={selectClass}
              >
                <option value="">All statuses</option>
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[9rem] flex-1 flex-col gap-1">
              <span className={fieldLabelClass}>Payment</span>
              <select
                name="payment"
                defaultValue={filters.paymentStatus ?? ""}
                className={selectClass}
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
        </OpsPanel>

        {rows.length > 0 ? (
          <div className="relative max-w-sm">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reference or car…"
              className="pl-8"
              aria-label="Search bookings"
            />
          </div>
        ) : null}

        <OpsPanel>
          <Table className="text-ui">
            <TableHeader>
              <TableRow>
                <TableHead className={opsTableHeadClass}>Reference</TableHead>
                <TableHead className={opsTableHeadClass}>Car</TableHead>
                <TableHead className={opsTableHeadClass}>Pickup</TableHead>
                <TableHead className={opsTableHeadClass}>Total</TableHead>
                <TableHead className={opsTableHeadClass}>Status</TableHead>
                <TableHead className={opsTableHeadClass}>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    {hasFilters
                      ? "No bookings match these filters."
                      : "No bookings yet."}
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No bookings match “{query.trim()}”.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((b) => (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer"
                    onClick={() => openBooking(b)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openBooking(b);
                          }}
                          className="font-mono font-medium underline-offset-4 hover:underline"
                        >
                          {b.reference_code}
                        </button>
                        <CopyReferenceButton code={b.reference_code} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.car_name ?? <OpsEmptyValue label="No car" />}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                      {formatDateTime(b.pickup_at)}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
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
        </OpsPanel>
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
