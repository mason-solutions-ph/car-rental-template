export type AdminPaidDailyPoint = {
  /** UTC calendar day, "YYYY-MM-DD". */
  date: string;
  count: number;
  revenueCents: number;
};

export type PaidRow = {
  paid_at: string | null;
  amount_paid_cents: number | null;
  total_cents: number | null;
};

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Bucket paid bookings into a dense daily series of exactly `days` points,
 * oldest first, ending on the UTC day of `now`. Days are UTC calendar days;
 * rows outside the window or without paid_at are dropped. Revenue falls back
 * amount_paid_cents -> total_cents (same as getAdminDashboardStats).
 */
export function bucketPaidByDay(
  rows: PaidRow[],
  opts: { days: number; now: Date }
): AdminPaidDailyPoint[] {
  const { days, now } = opts;
  if (days <= 0) return [];

  const byDay = new Map<string, AdminPaidDailyPoint>();
  const points: AdminPaidDailyPoint[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const endUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  for (let i = days - 1; i >= 0; i--) {
    const point: AdminPaidDailyPoint = {
      date: utcDayKey(new Date(endUtcMidnight - i * dayMs)),
      count: 0,
      revenueCents: 0,
    };
    byDay.set(point.date, point);
    points.push(point);
  }

  for (const row of rows) {
    if (!row.paid_at) continue;
    const paid = new Date(row.paid_at);
    if (Number.isNaN(paid.getTime())) continue;
    const point = byDay.get(utcDayKey(paid));
    if (!point) continue;
    point.count += 1;
    point.revenueCents += row.amount_paid_cents ?? row.total_cents ?? 0;
  }

  return points;
}
