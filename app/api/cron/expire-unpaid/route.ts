import { NextResponse } from "next/server";
import { expireAllStaleUnpaid } from "@/lib/bookings/lifecycle";
import { createPrivilegedBookingStore } from "@/lib/bookings/privileged-store";
import {
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from "@/lib/env";

/**
 * Expire pending+unpaid checkout holds past CHECKOUT_HOLD_MINUTES.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` (Vercel Cron injects this when
 * CRON_SECRET is set in the project env).
 *
 * Schedule: vercel.json → every 15 minutes.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required." },
      { status: 500 }
    );
  }

  try {
    const store = createPrivilegedBookingStore();
    const result = await expireAllStaleUnpaid(store);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      expired: result.data.expired,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Expire unpaid failed.",
      },
      { status: 500 }
    );
  }
}

/** Allow POST for manual schedulers that prefer it. */
export async function POST(request: Request) {
  return GET(request);
}
