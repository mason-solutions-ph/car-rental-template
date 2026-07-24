import Link from "next/link";

import { ExpireHoldsButton } from "@/components/admin/expire-holds-button";
import { OpsEmptyState } from "@/components/admin/ops-empty-state";
import { OpsEmptyValue } from "@/components/admin/ops-empty-value";
import { OpsPanel } from "@/components/admin/ops-panel";
import { opsTableHeadClass, OpsSectionHeader } from "@/components/admin/ops-chrome";
import {
  OpsBookingStatusBadge,
  OpsPaymentStatusBadge,
} from "@/components/admin/ops-status-badge";
import { UnpaidBookingsQueue } from "@/components/admin/unpaid-bookings-queue";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import {
  listAdminUnpaidPending,
  listAdminUpcomingPickups,
} from "@/lib/admin/queries";
import { getFleetMode } from "@/lib/data/get-fleet-repo";
import { formatDateTime } from "@/lib/format/date";

export async function NeedsActionSection() {
  const live = getFleetMode() === "live";

  if (!live) {
    return (
      <section aria-labelledby="ops-unpaid" className="flex flex-col gap-3">
        <OpsSectionHeader
          id="ops-unpaid"
          title="Needs action"
          tone="attention"
          description="Pending checkouts still unpaid."
        />
        <OpsEmptyState
          title="Holds appear in live mode"
          description="Connect Supabase and take a checkout. Unpaid pending bookings and reconcile actions show up here."
        />
      </section>
    );
  }

  const rows = await listAdminUnpaidPending(25);

  return (
    <section aria-labelledby="ops-unpaid" className="flex flex-col gap-3">
      <OpsSectionHeader
        id="ops-unpaid"
        title="Needs action"
        tone="attention"
        description={`Pending checkouts still unpaid. Hold is ${CHECKOUT_HOLD_MINUTES} minutes. Reconcile when a webhook lags.`}
        actions={
          <>
            <ExpireHoldsButton />
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/bookings?status=pending&payment=unpaid">
                View all
              </Link>
            </Button>
          </>
        }
      />
      <UnpaidBookingsQueue
        rows={rows}
        emptyMessage="No unpaid pending bookings. Queue is clear."
      />
    </section>
  );
}

export async function UpcomingPickupsSection() {
  const live = getFleetMode() === "live";

  if (!live) {
    return (
      <section aria-labelledby="ops-pickups" className="flex flex-col gap-3">
        <OpsSectionHeader
          id="ops-pickups"
          title="Pickups"
          meta="Next 7 days"
          description="Confirmed or active rentals due for pickup."
        />
        <OpsEmptyState
          title="No live schedule"
          description="Upcoming pickups list confirmed and active rentals once bookings are live."
        />
      </section>
    );
  }

  const upcoming = await listAdminUpcomingPickups(10, 7);

  return (
    <section aria-labelledby="ops-pickups" className="flex flex-col gap-3">
      <OpsSectionHeader
        id="ops-pickups"
        title="Pickups"
        meta="Next 7 days"
        description="Confirmed or active rentals due for pickup."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/bookings?status=confirmed">All confirmed</Link>
          </Button>
        }
      />
      {upcoming.length === 0 ? (
        <OpsEmptyState
          title="Nothing scheduled"
          description="No confirmed or active rentals are due for pickup in the next week."
        />
      ) : (
        <OpsPanel>
          <Table className="text-ui">
            <TableHeader>
              <TableRow>
                <TableHead className={opsTableHeadClass}>Reference</TableHead>
                <TableHead className={opsTableHeadClass}>Car</TableHead>
                <TableHead className={opsTableHeadClass}>Pickup</TableHead>
                <TableHead className={opsTableHeadClass}>Status</TableHead>
                <TableHead className={opsTableHeadClass}>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-mono font-medium underline-offset-4 hover:underline"
                    >
                      {b.reference_code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {b.car_name ?? <OpsEmptyValue label="No car" />}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                    {formatDateTime(b.pickup_at)}
                  </TableCell>
                  <TableCell>
                    <OpsBookingStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>
                    <OpsPaymentStatusBadge status={b.payment_status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </OpsPanel>
      )}
    </section>
  );
}
