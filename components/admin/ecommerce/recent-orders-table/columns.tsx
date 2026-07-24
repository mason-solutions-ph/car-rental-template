import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/format/date";
import type { BookingStatus, PaymentStatus } from "@/types";

import type { OrderRow } from "./schema";

function PaymentBadge({ status }: { status: PaymentStatus }) {
  if (status === "paid") {
    return (
      <Badge
        className="border-green-700/25 text-green-700 dark:border-green-300/25 dark:text-green-300"
        variant="outline"
      >
        <span className="size-1.5 rounded-full bg-current" />
        Paid
      </Badge>
    );
  }

  if (status === "refunded") {
    return (
      <Badge variant="destructive">
        <span className="size-1.5 rounded-full bg-current" />
        Refunded
      </Badge>
    );
  }

  if (status === "failed" || status === "expired") {
    return (
      <Badge variant="destructive">
        <span className="size-1.5 rounded-full bg-current" />
        {status === "failed" ? "Failed" : "Expired"}
      </Badge>
    );
  }

  return (
    <Badge
      className="border-yellow-700/25 text-yellow-700 dark:border-yellow-300/25 dark:text-yellow-300"
      variant="outline"
    >
      <span className="size-1.5 rounded-full bg-current" />
      Unpaid
    </Badge>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  if (status === "confirmed" || status === "active" || status === "completed") {
    return (
      <Badge
        className="border-green-700/25 text-green-700 capitalize dark:border-green-300/25 dark:text-green-300"
        variant="outline"
      >
        <span className="size-1.5 rounded-full bg-current" />
        {status}
      </Badge>
    );
  }

  if (status === "cancelled") {
    return (
      <Badge variant="destructive" className="capitalize">
        <span className="size-1.5 rounded-full bg-current" />
        {status}
      </Badge>
    );
  }

  return (
    <Badge
      className="border-yellow-700/25 text-yellow-700 capitalize dark:border-yellow-300/25 dark:text-yellow-300"
      variant="outline"
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

export const recentOrdersColumns: ColumnDef<OrderRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="w-10">
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
      <div className="w-10">
        <Checkbox
          aria-label={`Select booking ${row.original.reference}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: "reference",
    header: "Booking",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <Link
          href={`/admin/bookings/${row.original.id}`}
          className="font-medium leading-none underline-offset-4 hover:underline"
        >
          {row.original.reference}
        </Link>
        <div className="text-muted-foreground text-xs">
          {row.original.car}
          {row.original.rentalDays
            ? ` · ${row.original.rentalDays} day${row.original.rentalDays === 1 ? "" : "s"}`
            : ""}
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "customer",
    header: "Customer",
  },
  {
    id: "statusSummary",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-2">
        <PaymentBadge status={row.original.payment} />
        <StatusBadge status={row.original.status} />
      </div>
    ),
    filterFn: (row, _columnId, value) => {
      if (value === "Needs action") {
        return (
          (row.original.status === "pending" &&
            row.original.payment === "unpaid") ||
          row.original.payment === "failed" ||
          row.original.payment === "expired"
        );
      }

      if (value === "Unpaid") {
        return row.original.payment === "unpaid";
      }

      if (value === "Active") {
        return row.original.status === "active" || row.original.status === "confirmed";
      }

      if (value === "Cancelled") {
        return row.original.status === "cancelled";
      }

      return true;
    },
  },
  {
    accessorKey: "total",
    header: () => <div className="w-28">Total</div>,
    cell: ({ row }) => (
      <div className="w-28 tabular-nums">{row.original.total}</div>
    ),
  },
  {
    accessorKey: "date",
    header: () => <div className="w-44">Created</div>,
    cell: ({ row }) => (
      <div className="w-44 text-muted-foreground">
        {formatDateTime(row.original.date)}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="flex w-full justify-end">Actions</div>,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex w-full justify-end">
            <Button aria-label="Open booking actions" size="icon-sm" variant="ghost">
              <MoreHorizontal />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Booking</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/admin/bookings/${row.original.id}`}>View booking</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/bookings?status=pending&payment=unpaid`}>
                Unpaid queue
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
    enableSorting: false,
  },
];
