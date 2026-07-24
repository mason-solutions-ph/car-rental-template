"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { BookingManageForm } from "@/components/admin/booking-manage-form";
import { BookingPreview } from "@/components/admin/booking-invoice/booking-preview";
import { bookingToPaperModel } from "@/components/admin/booking-invoice/data";
import {
  OpsBookingStatusBadge,
  OpsPaymentStatusBadge,
} from "@/components/admin/ops-status-badge";
import { Button } from "@/components/ui/button";
import type { AdminBookingDetail } from "@/lib/admin/queries";

/**
 * Studio Invoice page shell: title actions + two columns (manage | paper preview).
 */
export function BookingDetail({ booking }: { booking: AdminBookingDetail }) {
  const model = bookingToPaperModel(booking);

  const manageTarget = {
    id: booking.id,
    reference_code: booking.reference_code,
    status: booking.status,
    payment_status: booking.payment_status,
    total_cents: booking.total_cents,
    pickup_at: booking.pickup_at,
    dropoff_at: booking.dropoff_at,
    admin_note: booking.admin_note,
    paymongo_checkout_session_id: booking.paymongo_checkout_session_id,
    paymongo_payment_id: booking.paymongo_payment_id,
    car_name: booking.car?.name ?? null,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-medium text-3xl leading-none tracking-tight">
            Booking {booking.reference_code}
          </h1>
          <p className="text-muted-foreground text-sm">
            Review the booking paper, update status, or reconcile payment.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <OpsBookingStatusBadge status={booking.status} />
            <OpsPaymentStatusBadge status={booking.payment_status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/bookings">
              <ArrowLeft data-icon="inline-start" />
              Back
            </Link>
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer data-icon="inline-start" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
          <div>
            <h2 className="font-medium text-lg">Manage</h2>
            <p className="text-muted-foreground text-sm">
              Status transitions, notes, and PayMongo reconcile.
            </p>
          </div>
          <BookingManageForm booking={manageTarget} compact />
        </div>

        <BookingPreview model={model} />
      </div>
    </div>
  );
}
