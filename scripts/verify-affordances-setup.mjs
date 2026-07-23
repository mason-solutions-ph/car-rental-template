/**
 * One-shot: ensure a verify user + three bookings for affordance UI checks.
 * Uses service role from .env.local. Not imported by the app.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase URL or service role key");
  process.exit(1);
}

const email = process.env.VERIFY_USER_EMAIL ?? "verify-arch@example.com";
const password = process.env.VERIFY_USER_PASSWORD ?? "VerifyArch123!";

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureUser() {
  const list = await admin.auth.admin.listUsers({ perPage: 200 });
  if (list.error) throw list.error;
  let user = list.data.users.find((u) => u.email === email);
  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Verify Arch" },
    });
    if (created.error) throw created.error;
    user = created.data.user;
    console.log("created_user", user.id);
  } else {
    // reset password so we can log in
    const upd = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (upd.error) throw upd.error;
    console.log("existing_user", user.id);
  }
  return user;
}

async function main() {
  const user = await ensureUser();

  const { data: cars, error: carErr } = await admin
    .from("cars")
    .select("id, name")
    .eq("is_published", true)
    .limit(1);
  if (carErr) throw carErr;
  const car = cars?.[0];
  if (!car) {
    console.error("No published cars in DB");
    process.exit(1);
  }

  const { data: locs, error: locErr } = await admin
    .from("locations")
    .select("id")
    .eq("is_published", true)
    .limit(1);
  if (locErr) throw locErr;
  const loc = locs?.[0];
  if (!loc) {
    console.error("No locations");
    process.exit(1);
  }

  // Clean previous verify bookings for this user (by driver note marker)
  await admin
    .from("bookings")
    .delete()
    .eq("customer_id", user.id)
    .eq("customer_note", "verify-arch-affordance");

  const base = {
    customer_id: user.id,
    car_id: car.id,
    pickup_location_id: loc.id,
    dropoff_location_id: loc.id,
    daily_rate_cents: 100000,
    rental_days: 2,
    subtotal_cents: 200000,
    fees_cents: 0,
    total_cents: 200000,
    currency: "PHP",
    driver_full_name: "Verify Arch",
    driver_phone: "+639170000000",
    driver_license_number: "VERIFY1",
    customer_note: "verify-arch-affordance",
  };

  const now = new Date();
  const farPickup = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const nearPickup = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const dropFar = new Date(farPickup.getTime() + 2 * 24 * 60 * 60 * 1000);
  const dropNear = new Date(nearPickup.getTime() + 2 * 24 * 60 * 60 * 1000);

  const rows = [
    {
      ...base,
      status: "pending",
      payment_status: "unpaid",
      pickup_at: farPickup.toISOString(),
      dropoff_at: dropFar.toISOString(),
      // unpaid pending → canPay + canCancel
    },
    {
      ...base,
      status: "confirmed",
      payment_status: "paid",
      paid_at: now.toISOString(),
      pickup_at: farPickup.toISOString(),
      dropoff_at: dropFar.toISOString(),
      // paid confirmed far → canCancel only
    },
    {
      ...base,
      status: "confirmed",
      payment_status: "paid",
      paid_at: now.toISOString(),
      pickup_at: nearPickup.toISOString(),
      dropoff_at: dropNear.toISOString(),
      // paid confirmed near → neither
    },
  ];

  const { data: inserted, error: insErr } = await admin
    .from("bookings")
    .insert(rows)
    .select("id, status, payment_status, pickup_at, reference_code");
  if (insErr) throw insErr;

  console.log(
    JSON.stringify(
      {
        email,
        password,
        car: car.name,
        bookings: inserted,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
