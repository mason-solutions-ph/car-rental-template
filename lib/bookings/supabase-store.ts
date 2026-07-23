import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BookableCar,
  BookingRecord,
  BookingStore,
  BookingUpdatePatch,
  InsertPendingBookingInput,
} from "@/lib/bookings/store";
import type { BookingStatus, PaymentStatus } from "@/types";

function mapRow(row: Record<string, unknown>): BookingRecord {
  const car = row.car as { name?: string } | null | undefined;
  return {
    id: String(row.id),
    reference_code: String(row.reference_code),
    customer_id: String(row.customer_id),
    car_id: String(row.car_id),
    status: row.status as BookingStatus,
    payment_status: row.payment_status as PaymentStatus,
    pickup_at: String(row.pickup_at),
    dropoff_at: String(row.dropoff_at),
    total_cents: Number(row.total_cents),
    rental_days: Number(row.rental_days),
    paymongo_checkout_session_id:
      (row.paymongo_checkout_session_id as string | null) ?? null,
    created_at: String(row.created_at),
    car_name: car?.name ?? null,
  };
}

/**
 * Supabase adapter for Booking lifecycle.
 * - `user`: cookie session client (create, cancel, admin transition under RLS)
 * - `admin`: service-role client (markPaid, expireUnpaid — no user session)
 */
export function createSupabaseBookingStore(clients: {
  user?: SupabaseClient;
  admin?: SupabaseClient;
}): BookingStore {
  const readWrite = () => clients.user ?? clients.admin;
  const privileged = () => clients.admin ?? clients.user;

  return {
    async getBookableCar(carId) {
      const sb = readWrite();
      if (!sb) throw new Error("BookingStore: no client for getBookableCar");
      const { data } = await sb
        .from("cars")
        .select("id, name, daily_rate_cents, currency, is_published, status")
        .eq("id", carId)
        .maybeSingle();
      return (data as BookableCar | null) ?? null;
    },

    async isCarAvailable({
      carId,
      pickupAt,
      dropoffAt,
      holdMinutes,
      excludeBookingId,
    }) {
      const sb = readWrite();
      if (!sb) throw new Error("BookingStore: no client for isCarAvailable");
      const { data } = await sb.rpc("car_is_available", {
        p_car_id: carId,
        p_pickup: pickupAt,
        p_dropoff: dropoffAt,
        p_exclude_booking_id: excludeBookingId ?? null,
        p_hold_minutes: holdMinutes,
      });
      return Boolean(data);
    },

    async expireUnpaidForCar(carId, olderThan) {
      const sb = privileged();
      if (!sb) throw new Error("BookingStore: no client for expireUnpaidForCar");
      const { data, error } = await sb
        .from("bookings")
        .update({ payment_status: "expired" })
        .eq("car_id", carId)
        .eq("status", "pending")
        .eq("payment_status", "unpaid")
        .lt("created_at", olderThan.toISOString())
        .select("id");
      if (error) {
        console.error("expireUnpaidForCar", error);
        return 0;
      }
      return data?.length ?? 0;
    },

    async expireAllStaleUnpaid(olderThan) {
      const sb = privileged();
      if (!sb) throw new Error("BookingStore: no client for expireAllStaleUnpaid");
      const { data, error } = await sb
        .from("bookings")
        .update({ payment_status: "expired" })
        .eq("status", "pending")
        .eq("payment_status", "unpaid")
        .lt("created_at", olderThan.toISOString())
        .select("id");
      if (error) {
        console.error("expireAllStaleUnpaid", error);
        return 0;
      }
      return data?.length ?? 0;
    },

    async insertPending(input: InsertPendingBookingInput) {
      const sb = readWrite();
      if (!sb) throw new Error("BookingStore: no client for insertPending");
      const { data, error } = await sb
        .from("bookings")
        .insert({
          customer_id: input.customerId,
          car_id: input.carId,
          pickup_location_id: input.pickupLocationId,
          dropoff_location_id: input.dropoffLocationId,
          pickup_at: input.pickupAt,
          dropoff_at: input.dropoffAt,
          daily_rate_cents: input.dailyRateCents,
          rental_days: input.rentalDays,
          subtotal_cents: input.subtotalCents,
          fees_cents: input.feesCents,
          total_cents: input.totalCents,
          currency: "PHP",
          status: "pending",
          payment_status: "unpaid",
          driver_full_name: input.driverFullName,
          driver_phone: input.driverPhone,
          driver_license_number: input.driverLicenseNumber,
          customer_note: input.customerNote ?? null,
        })
        .select("id, reference_code, total_cents, rental_days")
        .single();

      if (error || !data) {
        console.error(error);
        return { ok: false as const, error: "Could not create booking." };
      }
      return {
        ok: true as const,
        booking: {
          id: data.id as string,
          reference_code: data.reference_code as string,
          total_cents: data.total_cents as number,
          rental_days: data.rental_days as number,
        },
      };
    },

    async getById(id) {
      const sb = privileged() ?? readWrite();
      if (!sb) throw new Error("BookingStore: no client for getById");
      const { data, error } = await sb
        .from("bookings")
        .select("*, car:cars(name)")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      return mapRow(data as Record<string, unknown>);
    },

    async getByCheckoutSessionId(sessionId) {
      const sb = privileged() ?? readWrite();
      if (!sb) throw new Error("BookingStore: no client for getByCheckoutSessionId");
      const { data, error } = await sb
        .from("bookings")
        .select("*, car:cars(name)")
        .eq("paymongo_checkout_session_id", sessionId)
        .maybeSingle();
      if (error || !data) return null;
      return mapRow(data as Record<string, unknown>);
    },

    async update(id, patch: BookingUpdatePatch) {
      const sb = clients.user ?? clients.admin;
      if (!sb) throw new Error("BookingStore: no client for update");
      const { error } = await sb.from("bookings").update(patch).eq("id", id);
      if (error) throw error;
    },

    async privilegedUpdate(id, patch: BookingUpdatePatch) {
      const sb = clients.admin ?? clients.user;
      if (!sb) throw new Error("BookingStore: no client for privilegedUpdate");
      const { error } = await sb.from("bookings").update(patch).eq("id", id);
      if (error) throw error;
    },
  };
}
