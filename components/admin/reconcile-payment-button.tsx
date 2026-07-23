"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  reconcileAdminBooking,
  type ReconcileAdminResult,
} from "@/app/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ReconcilePaymentButton({
  bookingId,
  size = "default",
  variant = "default",
  className,
}: {
  bookingId: string;
  size?: "default" | "sm" | "lg" | "icon" | "xs";
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive"
    | "link";
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const result: ReconcileAdminResult = await reconcileAdminBooking(bookingId);
      if (result.reconciled) {
        toast.success(result.message);
      } else if (result.ok) {
        toast.message(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reconcile failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      disabled={pending}
      onClick={onClick}
    >
      {pending ? (
        <>
          <Spinner className="size-3.5" />
          Checking…
        </>
      ) : (
        "Reconcile payment"
      )}
    </Button>
  );
}
