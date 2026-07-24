import { format } from "date-fns";
import {
  demoUsers,
  type UserRow,
} from "@/components/admin/users/data";
import { getFleetRepo } from "@/lib/data/get-fleet-repo";
import {
  bucketPaidByDay,
  type AdminPaidDailyPoint,
  type PaidRow,
} from "@/lib/admin/revenue-series";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Booking,
  BookingStatus,
  Car,
  PaymentStatus,
} from "@/types";

export type { UserRow };

export type AdminDashboardStats = {
  publishedCars: number;
  unpaidPending: number;
  confirmed: number;
  active: number;
  paidThisWeek: number;
  revenueThisWeekCents: number;
  demo: boolean;
};

export type AdminNavBadges = {
  unpaidPending: number;
  demo: boolean;
};

export type AdminBookingListItem = {
  id: string;
  reference_code: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  total_cents: number;
  pickup_at: string;
  dropoff_at: string;
  created_at: string;
  admin_note: string | null;
  paymongo_checkout_session_id: string | null;
  paymongo_payment_id: string | null;
  car_name: string | null;
};

const ADMIN_BOOKING_LIST_SELECT =
  "id, reference_code, status, payment_status, total_cents, pickup_at, dropoff_at, created_at, admin_note, paymongo_checkout_session_id, paymongo_payment_id, car:cars(name)";

function mapAdminBookingListRow(b: Record<string, unknown>): AdminBookingListItem {
  return {
    id: b.id as string,
    reference_code: b.reference_code as string,
    status: b.status as BookingStatus,
    payment_status: b.payment_status as PaymentStatus,
    total_cents: b.total_cents as number,
    pickup_at: b.pickup_at as string,
    dropoff_at: b.dropoff_at as string,
    created_at: b.created_at as string,
    admin_note: (b.admin_note as string | null) ?? null,
    paymongo_checkout_session_id:
      (b.paymongo_checkout_session_id as string | null) ?? null,
    paymongo_payment_id: (b.paymongo_payment_id as string | null) ?? null,
    car_name: (b.car as { name?: string } | null)?.name ?? null,
  };
}

export type AdminBookingDetail = Booking & {
  car: { name: string | null; slug: string | null } | null;
  pickup_location: { name: string | null; city: string | null } | null;
  dropoff_location: { name: string | null; city: string | null } | null;
  customer: { full_name: string | null } | null;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const fleet = await getFleetRepo();
  const publishedPage = await fleet.listPublishedCars({ pageSize: 1 });

  if (fleet.mode === "demo") {
    return {
      publishedCars: publishedPage.total,
      unpaidPending: 0,
      confirmed: 0,
      active: 0,
      paidThisWeek: 0,
      revenueThisWeekCents: 0,
      demo: true,
    };
  }

  const supabase = await createClient();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  const [unpaidRes, confirmedRes, activeRes, paidWeekRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("payment_status", "unpaid"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("bookings")
      .select("amount_paid_cents, total_cents")
      .eq("payment_status", "paid")
      .gte("paid_at", weekAgoIso),
  ]);

  const weekRows = paidWeekRes.data ?? [];
  const revenueThisWeekCents = weekRows.reduce(
    (sum, b) => sum + (b.amount_paid_cents ?? b.total_cents ?? 0),
    0
  );

  return {
    publishedCars: publishedPage.total,
    unpaidPending: unpaidRes.count ?? 0,
    confirmed: confirmedRes.count ?? 0,
    active: activeRes.count ?? 0,
    paidThisWeek: weekRows.length,
    revenueThisWeekCents,
    demo: false,
  };
}

export async function getAdminNavBadges(): Promise<AdminNavBadges> {
  if (!isSupabaseConfigured()) {
    return { unpaidPending: 0, demo: true };
  }

  const fleet = await getFleetRepo();
  if (fleet.mode === "demo") {
    return { unpaidPending: 0, demo: true };
  }

  const supabase = await createClient();
  const unpaidRes = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("payment_status", "unpaid");

  return {
    unpaidPending: unpaidRes.count ?? 0,
    demo: false,
  };
}

/** Daily paid-booking counts and revenue for the trailing N UTC days. */
export async function getAdminPaidDailySeries(
  days = 14
): Promise<AdminPaidDailyPoint[]> {
  if (!isSupabaseConfigured()) return [];

  const fleet = await getFleetRepo();
  if (fleet.mode === "demo") return [];

  const supabase = await createClient();
  const now = new Date();
  const since = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      (days - 1) * 24 * 60 * 60 * 1000
  );

  const { data, error } = await supabase
    .from("bookings")
    .select("paid_at, amount_paid_cents, total_cents")
    .eq("payment_status", "paid")
    .gte("paid_at", since.toISOString());

  if (error) {
    console.error(error);
    return [];
  }

  return bucketPaidByDay((data ?? []) as PaidRow[], { days, now });
}

/** Confirmed or active pickups from now through the next N days. */
export async function listAdminUpcomingPickups(
  limit = 10,
  withinDays = 7
): Promise<AdminBookingListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const fleet = await getFleetRepo();
  if (fleet.mode === "demo") return [];

  const supabase = await createClient();
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + withinDays);

  const { data, error } = await supabase
    .from("bookings")
    .select(ADMIN_BOOKING_LIST_SELECT)
    .in("status", ["confirmed", "active"])
    .gte("pickup_at", now.toISOString())
    .lte("pickup_at", until.toISOString())
    .order("pickup_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []).map((b) =>
    mapAdminBookingListRow(b as Record<string, unknown>)
  );
}

export async function listAdminCars(): Promise<Car[]> {
  const fleet = await getFleetRepo();
  return fleet.listAllCars();
}

export async function getAdminCarById(id: string): Promise<Car | null> {
  const fleet = await getFleetRepo();
  return fleet.getCarById(id);
}

export type ListAdminBookingsOptions = {
  limit?: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
};

export async function listAdminBookings(
  limitOrOpts: number | ListAdminBookingsOptions = 100
): Promise<AdminBookingListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const opts: ListAdminBookingsOptions =
    typeof limitOrOpts === "number" ? { limit: limitOrOpts } : limitOrOpts;
  const limit = opts.limit ?? 100;

  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select(ADMIN_BOOKING_LIST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.paymentStatus) query = query.eq("payment_status", opts.paymentStatus);

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []).map((b) =>
    mapAdminBookingListRow(b as Record<string, unknown>)
  );
}

/** Pending + unpaid bookings that still need payment or expire. */
export async function listAdminUnpaidPending(
  limit = 50
): Promise<AdminBookingListItem[]> {
  return listAdminBookings({
    limit,
    status: "pending",
    paymentStatus: "unpaid",
  });
}

export async function getAdminBookingById(
  id: string
): Promise<AdminBookingDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      [
        "*",
        "car:cars(name, slug)",
        "pickup_location:locations!pickup_location_id(name, city)",
        "dropoff_location:locations!dropoff_location_id(name, city)",
        "customer:profiles!customer_id(full_name)",
      ].join(", ")
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error(error);
    return null;
  }

  const row = data as unknown as Record<string, unknown>;
  return {
    ...(row as unknown as Booking),
    car: unwrapRel(row.car) as AdminBookingDetail["car"],
    pickup_location: unwrapRel(
      row.pickup_location
    ) as AdminBookingDetail["pickup_location"],
    dropoff_location: unwrapRel(
      row.dropoff_location
    ) as AdminBookingDetail["dropoff_location"],
    customer: unwrapRel(row.customer) as AdminBookingDetail["customer"],
  };
}

function unwrapRel<T>(value: unknown): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return value as T;
}

/**
 * Users table for /admin/users.
 * Live: maps profiles (admin RLS). Email lives on auth.users — show phone as contact when present.
 * Demo: Studio Admin seed list so the UI is fully browsable offline.
 */
export async function listAdminUsers(): Promise<UserRow[]> {
  if (!isSupabaseConfigured()) {
    return demoUsers;
  }

  const fleet = await getFleetRepo();
  if (fleet.mode === "demo") {
    return demoUsers;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error(error);
    return demoUsers;
  }

  if (!data?.length) {
    return demoUsers;
  }

  return data.map((p): UserRow => {
    const name = p.full_name?.trim() || "User";
    const isAdmin = p.role === "admin";
    const joined = new Date(p.created_at);
    return {
      id: p.id,
      name,
      contact: p.phone?.trim() || `${p.id.slice(0, 8)}…`,
      role: isAdmin ? "Admin" : "Customer",
      joinedDate: format(joined, "dd MMM yyyy, h:mm a"),
      joinedAt: joined.getTime(),
    };
  });
}

