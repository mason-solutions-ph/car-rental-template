import { DEMO_CARS, DEMO_LOCATIONS } from "@/lib/data/demo";
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
  if (!isSupabaseConfigured()) {
    return {
      publishedCars: DEMO_CARS.filter((c) => c.is_published).length,
      unpaidPending: 0,
      paidThisWeek: 0,
      grossPaidCents: 0,
      demo: true,
    };
  }

  const supabase = await createClient();

  const { count: publishedCars } = await supabase
    .from("cars")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .neq("status", "retired");

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
    publishedCars: publishedCars ?? 0,
    unpaidPending: unpaidPending ?? 0,
    paidThisWeek,
    grossPaidCents,
    demo: false,
  };
}

export async function listAdminCars(): Promise<Car[]> {
  if (!isSupabaseConfigured()) {
    return [...DEMO_CARS].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as Car[];
}

export async function getAdminCarById(id: string): Promise<Car | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_CARS.find((c) => c.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data as Car | null;
}

export async function listAdminBookings(
  limit = 100
): Promise<AdminBookingListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, reference_code, status, payment_status, total_cents, pickup_at, created_at, paymongo_checkout_session_id, car:cars(name)"
    )
    .order("created_at", { ascending: false })
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
  if (!isSupabaseConfigured()) {
    return DEMO_LOCATIONS.filter((l) => l.is_published);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as Location[];
}

export type AdminContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
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
    .select("id, name, email, phone, subject, message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as AdminContactMessage[];
}
