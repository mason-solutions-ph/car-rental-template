"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckIcon, CopyIcon, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { HoldTimer } from "@/components/admin/hold-timer";
import { OpsEmptyValue } from "@/components/admin/ops-empty-value";
import {
  OpsBookingStatusBadge,
  OpsPaymentStatusBadge,
} from "@/components/admin/ops-status-badge";
import { ReconcilePaymentButton } from "@/components/admin/reconcile-payment-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminBookingListItem } from "@/lib/admin/queries";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";

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

export const bookingsColumns: ColumnDef<AdminBookingListItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Select all bookings"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Select ${row.original.reference_code}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) =>
      `${row.reference_code} ${row.car_name ?? ""} ${row.status} ${row.payment_status}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    id: "needsAction",
    accessorFn: (row) =>
      row.status === "pending" && row.payment_status === "unpaid"
        ? "needs"
        : "ok",
    filterFn: "equalsString",
    enableHiding: true,
  },
  {
    accessorKey: "reference_code",
    header: "Booking",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-1">
        <Link
          href={`/admin/bookings/${row.original.id}`}
          className="truncate font-mono font-medium underline-offset-4 hover:underline"
        >
          {row.original.reference_code}
        </Link>
        <CopyReferenceButton code={row.original.reference_code} />
      </div>
    ),
  },
  {
    accessorKey: "car_name",
    header: "Car",
    cell: ({ row }) => (
      <div className="min-w-0 truncate text-sm">
        {row.original.car_name ?? <OpsEmptyValue label="No car" />}
      </div>
    ),
  },
  {
    id: "pickup",
    accessorFn: (row) => new Date(row.pickup_at).getTime(),
    header: "Pickup",
    cell: ({ row }) => (
      <div className="text-muted-foreground font-mono text-xs tabular-nums">
        {formatDateTime(row.original.pickup_at)}
      </div>
    ),
  },
  {
    id: "hold",
    header: "Hold",
    cell: ({ row }) => {
      if (
        row.original.status !== "pending" ||
        row.original.payment_status !== "unpaid"
      ) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }
      return (
        <HoldTimer
          createdAt={row.original.created_at}
          holdMinutes={CHECKOUT_HOLD_MINUTES}
        />
      );
    },
    enableSorting: false,
  },
  {
    id: "total",
    accessorFn: (row) => row.total_cents,
    header: "Total",
    cell: ({ row }) => (
      <div className="font-mono text-sm tabular-nums">
        {formatMoney(row.original.total_cents)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <OpsBookingStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "payment_status",
    header: "Payment",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <OpsPaymentStatusBadge status={row.original.payment_status} />
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const b = row.original;
      const canReconcile =
        b.payment_status === "unpaid" &&
        b.status === "pending" &&
        Boolean(b.paymongo_checkout_session_id);

      return (
        <div className="flex items-center justify-end gap-1">
          {canReconcile ? (
            <ReconcilePaymentButton
              bookingId={b.id}
              size="sm"
              variant="outline"
            />
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Open actions for ${b.reference_code}`}
                className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                size="icon-sm"
                variant="ghost"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/bookings/${b.id}`}>Open booking</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void copyText("Reference", b.reference_code)}
              >
                Copy reference
              </DropdownMenuItem>
              {b.paymongo_checkout_session_id ? (
                <DropdownMenuItem
                  onClick={() =>
                    void copyText(
                      "Session",
                      b.paymongo_checkout_session_id ?? ""
                    )
                  }
                >
                  Copy PayMongo session
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/bookings/${b.id}`}>Manage status</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableHiding: false,
    enableSorting: false,
  },
];
