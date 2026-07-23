import { NextResponse } from "next/server";
import { runExpireStaleUnpaidHolds } from "@/lib/bookings/expire-unpaid";

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

  const result = await runExpireStaleUnpaidHolds();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    expired: result.expired,
  });
}

/** Allow POST for manual schedulers that prefer it. */
export async function POST(request: Request) {
  return GET(request);
}
