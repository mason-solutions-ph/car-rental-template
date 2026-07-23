import { getFleetRepo } from "@/lib/data/get-fleet-repo";
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
  paidThisWeek: number;
  grossPaidCents: number;
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
      paidThisWeek: 0,
      grossPaidCents: 0,
      demo: true,
    };
  }

  const supabase = await createClient();

  const { count: unpaidPending } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("payment_status", "unpaid");

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: paid } = await supabase
    .from("bookings")
    .select("amount_paid_cents, total_cents, paid_at")
    .eq("payment_status", "paid");

  const rows = paid ?? [];
  const grossPaidCents = rows.reduce(
    (sum, b) => sum + (b.amount_paid_cents ?? b.total_cents ?? 0),
    0
  );
  const paidThisWeek = rows.filter(
    (b) => b.paid_at && new Date(b.paid_at) >= weekAgo
  ).length;

  return {
    publishedCars: publishedPage.total,
    unpaidPending: unpaidPending ?? 0,
    paidThisWeek,
    grossPaidCents,
    demo: false,
  };
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
