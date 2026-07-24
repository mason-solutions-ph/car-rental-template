"use client";
"use no memo";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";

import {
  AddOnsiteBookingDialog,
  type OnsiteCarOption,
} from "@/components/admin/add-onsite-booking-dialog";
import { bookingsColumns } from "@/components/admin/bookings/bookings-columns";
import { BookingsTable } from "@/components/admin/bookings/bookings-table";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AdminBookingListItem } from "@/lib/admin/queries";
import {
  BOOKING_STATUSES,
  CHECKOUT_HOLD_MINUTES,
  PAYMENT_STATUSES,
} from "@/lib/constants";
import type { BookingStatus, PaymentStatus } from "@/types";

/**
 * Studio Users-style bookings list: card shell, search, filters, TanStack table.
 * Row open → /admin/bookings/[id] (invoice detail).
 */
export function BookingsAdmin({
  rows,
  unpaidQueue,
  filters,
  openOnsiteOnMount = false,
  onsiteCars = [],
  onsiteLocationId = "",
  onsiteLocationName = "",
}: {
  rows: AdminBookingListItem[];
  unpaidQueue: AdminBookingListItem[];
  filters: { status?: BookingStatus; paymentStatus?: PaymentStatus };
  initialBookingId?: string | null;
  openOnsiteOnMount?: boolean;
  onsiteCars?: OnsiteCarOption[];
  onsiteLocationId?: string;
  onsiteLocationName?: string;
}) {
  const router = useRouter();
  const unpaidCount = unpaidQueue.length;

  // Prefer full list; if server filtered empty, still show something useful
  const data = rows;

  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "pickup", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    () => {
      const initial: ColumnFiltersState = [];
      if (filters.status) {
        initial.push({ id: "status", value: filters.status });
      }
      if (filters.paymentStatus) {
        initial.push({ id: "payment_status", value: filters.paymentStatus });
      }
      if (
        filters.status === "pending" &&
        filters.paymentStatus === "unpaid"
      ) {
        initial.push({ id: "needsAction", value: "needs" });
      }
      return initial;
    }
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      search: false,
      needsAction: false,
    });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns: bookingsColumns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const searchQuery =
    (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string | undefined) ??
    "all";
  const paymentFilter =
    (table.getColumn("payment_status")?.getFilterValue() as
      | string
      | undefined) ?? "all";
  const needsFilter =
    (table.getColumn("needsAction")?.getFilterValue() as string | undefined) ===
    "needs";
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const visibleCount = table.getFilteredRowModel().rows.length;

  function syncUrl(next: {
    status?: string;
    payment?: string;
    needs?: boolean;
  }) {
    const params = new URLSearchParams();
    if (next.needs) {
      params.set("status", "pending");
      params.set("payment", "unpaid");
    } else {
      if (next.status && next.status !== "all") {
        params.set("status", next.status);
      }
      if (next.payment && next.payment !== "all") {
        params.set("payment", next.payment);
      }
    }
    const q = params.toString();
    router.push(q ? `/admin/bookings?${q}` : "/admin/bookings");
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Bookings</CardTitle>
        <CardDescription className="max-w-md leading-snug">
          Manage rentals, payments, and checkout holds
          {unpaidCount > 0
            ? ` · ${unpaidCount} need action (hold ${CHECKOUT_HOLD_MINUTES}m)`
            : null}
          .
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Search reference or car..."
              value={searchQuery}
              onChange={(event) => {
                table
                  .getColumn("search")
                  ?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
          </InputGroup>
          <AddOnsiteBookingDialog
            cars={onsiteCars}
            locationId={onsiteLocationId}
            locationName={onsiteLocationName}
            defaultOpen={openOnsiteOnMount}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              size="sm"
              value={needsFilter ? "needs" : "all"}
              onValueChange={(value) => {
                if (!value) return;
                if (value === "needs") {
                  table.getColumn("needsAction")?.setFilterValue("needs");
                  table.getColumn("status")?.setFilterValue(undefined);
                  table.getColumn("payment_status")?.setFilterValue(undefined);
                  table.setPageIndex(0);
                  syncUrl({ needs: true });
                } else {
                  table.getColumn("needsAction")?.setFilterValue(undefined);
                  table.setPageIndex(0);
                  syncUrl({
                    status: statusFilter,
                    payment: paymentFilter,
                  });
                }
              }}
              className="bg-muted p-0.75"
            >
              <ToggleGroupItem value="all" className="px-3">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="needs" className="px-3">
                Needs action
                {unpaidCount > 0 ? ` (${unpaidCount})` : ""}
              </ToggleGroupItem>
            </ToggleGroup>

            <Select
              value={statusFilter === undefined ? "all" : statusFilter}
              onValueChange={(value) => {
                if (!value) return;
                table.getColumn("needsAction")?.setFilterValue(undefined);
                table
                  .getColumn("status")
                  ?.setFilterValue(value === "all" ? undefined : value);
                table.setPageIndex(0);
                syncUrl({
                  status: value,
                  payment: paymentFilter,
                });
              }}
            >
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Status:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  {BOOKING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={paymentFilter === undefined ? "all" : paymentFilter}
              onValueChange={(value) => {
                if (!value) return;
                table.getColumn("needsAction")?.setFilterValue(undefined);
                table
                  .getColumn("payment_status")
                  ?.setFilterValue(value === "all" ? undefined : value);
                table.setPageIndex(0);
                syncUrl({
                  status: statusFilter,
                  payment: value,
                });
              }}
            >
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Payment:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground text-sm tabular-nums">
            {selectedCount > 0
              ? `${selectedCount} selected`
              : `${visibleCount} booking${visibleCount === 1 ? "" : "s"}`}
          </div>
        </div>

        <BookingsTable table={table} />
      </CardContent>
    </Card>
  );
}
