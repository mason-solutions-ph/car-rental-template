"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyIcon } from "lucide-react";
import { OpsEmptyValue } from "@/components/admin/ops-empty-value";
import { toast } from "sonner";
import { updateAdminBookingStatus } from "@/app/actions/admin-bookings";
import {
  OpsBookingStatusBadge,
  OpsPaymentStatusBadge,
} from "@/components/admin/ops-status-badge";
import { ReconcilePaymentButton } from "@/components/admin/reconcile-payment-button";
import { FormSelect } from "@/components/forms/form-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { AdminBookingListItem } from "@/lib/admin/queries";
import { canAdminTransition } from "@/lib/bookings/lifecycle";
import { BOOKING_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import type { BookingStatus } from "@/types";

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

function CopyableMono({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <p className="text-muted-foreground flex items-start gap-1 break-all text-xs">
      <span className="shrink-0">{label}:</span>
      {value ? (
        <span className="font-mono">{value}</span>
      ) : (
        <OpsEmptyValue label={`No ${label.toLowerCase()}`} />
      )}
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-6 shrink-0"
          aria-label={`Copy ${label}`}
          onClick={() => void copyText(label, value)}
        >
          <CopyIcon className="size-3" />
        </Button>
      ) : null}
    </p>
  );
}

/** Minimal shape for status/reconcile form (list row or full detail). */
export type BookingManageTarget = Pick<
  AdminBookingListItem,
  | "id"
  | "reference_code"
  | "status"
  | "payment_status"
  | "total_cents"
  | "pickup_at"
  | "dropoff_at"
  | "admin_note"
  | "paymongo_checkout_session_id"
  | "paymongo_payment_id"
  | "car_name"
>;

export function BookingManageForm({
  booking,
  onSuccess,
  compact = false,
}: {
  booking: BookingManageTarget;
  onSuccess?: () => void;
  /** Hide summary block when the parent page already shows the document. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const currentStatus = booking.status as BookingStatus;
  const statusOptions = BOOKING_STATUSES.filter((s) =>
    canAdminTransition(currentStatus, s)
  );
  const showReconcile =
    booking.payment_status === "unpaid" &&
    booking.status === "pending" &&
    Boolean(booking.paymongo_checkout_session_id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await updateAdminBookingStatus(fd);
      toast.success("Booking updated");
      onSuccess?.();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update booking.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!compact ? (
        <>
          <div className="flex flex-wrap gap-2">
            <OpsBookingStatusBadge status={currentStatus} />
            <OpsPaymentStatusBadge status={booking.payment_status} />
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium">
              {booking.car_name ?? <OpsEmptyValue label="No car" />}
            </p>
            <p className="text-muted-foreground font-mono text-xs tabular-nums">
              {formatDateTime(booking.pickup_at)} →{" "}
              {formatDateTime(booking.dropoff_at)}
            </p>
            <p>
              Total:{" "}
              <span className="font-mono tabular-nums">
                {formatMoney(booking.total_cents)}
              </span>
            </p>
            <CopyableMono label="Reference" value={booking.reference_code} />
            <CopyableMono
              label="PayMongo session"
              value={booking.paymongo_checkout_session_id}
            />
            <CopyableMono
              label="Payment id"
              value={booking.paymongo_payment_id}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1 text-sm">
          <CopyableMono label="Reference" value={booking.reference_code} />
          <CopyableMono
            label="PayMongo session"
            value={booking.paymongo_checkout_session_id}
          />
          <CopyableMono
            label="Payment id"
            value={booking.paymongo_payment_id}
          />
        </div>
      )}

      {showReconcile ? (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Payment stuck unpaid?</p>
            <p className="text-muted-foreground text-xs">
              Pulls the Checkout Session from PayMongo and marks paid if a
              successful payment exists.
            </p>
            <ReconcilePaymentButton
              bookingId={booking.id}
              className="w-fit"
              size="sm"
            />
          </div>
        </>
      ) : null}

      <Separator />

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={booking.id} />
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <FormSelect
              id="status"
              name="status"
              defaultValue={booking.status}
              disabled={statusOptions.length <= 1}
              options={statusOptions.map((s) => ({
                value: s,
                label: s,
              }))}
            />
            <FieldDescription>
              Allowed moves only. Payment status is not changed here.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="adminNote">Admin note</FieldLabel>
            <Textarea
              id="adminNote"
              name="adminNote"
              defaultValue={booking.admin_note ?? ""}
              rows={3}
            />
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? <Spinner /> : null}
          Save
        </Button>
      </form>
    </div>
  );
}
