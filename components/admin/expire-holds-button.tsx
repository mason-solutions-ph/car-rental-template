"use client";

import { useState } from "react";
import { toast } from "sonner";
import { expireStaleUnpaidAction } from "@/app/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ExpireHoldsButton({
  size = "sm",
  variant = "outline",
}: {
  size?: "default" | "sm" | "lg" | "icon" | "xs";
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive"
    | "link";
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const result = await expireStaleUnpaidAction();
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Expire failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={pending}
      onClick={onClick}
      className="border-attention/40 text-attention hover:text-attention"
    >
      {pending ? (
        <>
          <Spinner className="size-3.5" />
          Expiring…
        </>
      ) : (
        "Expire stale holds"
      )}
    </Button>
  );
}
