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
  Location,
  PaymentStatus,
} from "@/types";

export type AdminDashboardStats = {
  publishedCars: number;
  unpaidPending: number;
  confirmed: number;
  active: number;
  paidThisWeek: number;
  revenueThisWeekCents: number;
  openMessages: number;
  demo: boolean;
};

export type AdminNavBadges = {
  unpaidPending: number;
  openMessages: number;
  demo: boolean;
};

export type AdminBookingListItem = {
  id: string;
  reference_code: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  total_cents: number;
  pickup_at: string;
  created_at: string;
  paymongo_checkout_session_id: string | null;
  car_name: string | null;
};

export type AdminBookingDetail = Booking & {
  car: { name: string | null; slug: string | null } | null;
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
      openMessages: 0,
      demo: true,
    };
  }

  const supabase = await createClient();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  const [
    unpaidRes,
    confirmedRes,
    activeRes,
    paidWeekRes,
    messagesRes,
  ] = await Promise.all([
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
    supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true }),
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
    openMessages: messagesRes.count ?? 0,
    demo: false,
  };
}

export async function getAdminNavBadges(): Promise<AdminNavBadges> {
  if (!isSupabaseConfigured()) {
    return { unpaidPending: 0, openMessages: 0, demo: true };
  }

  const fleet = await getFleetRepo();
  if (fleet.mode === "demo") {
    return { unpaidPending: 0, openMessages: 0, demo: true };
  }

  const supabase = await createClient();
  const [unpaidRes, messagesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("payment_status", "unpaid"),
    supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    unpaidPending: unpaidRes.count ?? 0,
    openMessages: messagesRes.count ?? 0,
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
    .select(
      "id, reference_code, status, payment_status, total_cents, pickup_at, created_at, paymongo_checkout_session_id, car:cars(name)"
    )
    .in("status", ["confirmed", "active"])
    .gte("pickup_at", now.toISOString())
    .lte("pickup_at", until.toISOString())
    .order("pickup_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []).map((b) => ({
    id: b.id as string,
    reference_code: b.reference_code as string,
    status: b.status as BookingStatus,
    payment_status: b.payment_status as PaymentStatus,
    total_cents: b.total_cents as number,
    pickup_at: b.pickup_at as string,
    created_at: b.created_at as string,
    paymongo_checkout_session_id:
      (b.paymongo_checkout_session_id as string | null) ?? null,
    car_name: (b.car as { name?: string } | null)?.name ?? null,
  }));
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
    .select(
      "id, reference_code, status, payment_status, total_cents, pickup_at, created_at, paymongo_checkout_session_id, car:cars(name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.paymentStatus) query = query.eq("payment_status", opts.paymentStatus);

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []).map((b) => ({
    id: b.id as string,
    reference_code: b.reference_code as string,
    status: b.status as BookingStatus,
    payment_status: b.payment_status as PaymentStatus,
    total_cents: b.total_cents as number,
    pickup_at: b.pickup_at as string,
    created_at: b.created_at as string,
    paymongo_checkout_session_id:
      (b.paymongo_checkout_session_id as string | null) ?? null,
    car_name: (b.car as { name?: string } | null)?.name ?? null,
  }));
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
    .select("*, car:cars(name, slug)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error(error);
    return null;
  }

  return data as AdminBookingDetail;
}

export async function listAdminLocations(): Promise<Location[]> {
  const fleet = await getFleetRepo();
  return fleet.listAllLocations();
}

export async function getAdminLocationById(
  id: string
): Promise<Location | null> {
  const fleet = await getFleetRepo();
  const all = await fleet.listAllLocations();
  return all.find((l) => l.id === id) ?? null;
}

export type AdminContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
};

export async function listAdminContactMessages(
  limit = 50
): Promise<AdminContactMessage[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, subject, message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as AdminContactMessage[];
}
