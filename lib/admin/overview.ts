import {
  formatDeltaPct,
  getOverviewPeriodRange,
  percentChange,
  type OverviewPeriod,
} from "@/lib/admin/overview-period";
import {
  bucketPaidByDay,
  type AdminPaidDailyPoint,
  type PaidRow,
} from "@/lib/admin/revenue-series";
import { getFleetRepo } from "@/lib/data/get-fleet-repo";
import { isSupabaseConfigured } from "@/lib/env";
import { formatMoney } from "@/lib/format/currency";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, Car, CarClass, PaymentStatus } from "@/types";

export type OverviewKpi = {
  label: string;
  value: string;
  /** For numeric ticker if needed later */
  raw: number;
  deltaLabel: string;
  deltaPositive: boolean | null;
  hint: string;
  /** When set, card links out (e.g. unpaid queue). */
  href?: string;
  /** Amber emphasis for operational urgency. */
  attention?: boolean;
};

export type OverviewChartPoint = {
  period: string;
  revenue: number;
  bookings: number;
};

export type OverviewActivityPoint = {
  date: string;
  bookings: number;
  unpaid: number;
};

export type OverviewStatusShare = {
  name: string;
  count: number;
  visits: string;
  share: number;
  change: string;
};

export type OverviewCategoryShare = {
  name: string;
  share: number;
  color: string;
};

export type OverviewTopCar = {
  name: string;
  category: string;
  share: string;
  sales: string;
};

export type OverviewFleetInventory = {
  available: number;
  maintenance: number;
  retired: number;
  availablePercent: number;
};

export type OverviewBookingRow = {
  id: string;
  reference: string;
  date: string;
  customer: string;
  payment: PaymentStatus;
  status: BookingStatus;
  total: string;
  totalCents: number;
  car: string;
  rentalDays: number;
};

export type AdminOverview = {
  demo: boolean;
  period: OverviewPeriod;
  periodLabel: string;
  kpis: {
    revenue: OverviewKpi;
    bookings: OverviewKpi;
    unpaid: OverviewKpi;
    customers: OverviewKpi;
    average: OverviewKpi;
    fleetAvailable: OverviewKpi;
  };
  revenueSeries: OverviewChartPoint[];
  activitySeries: OverviewActivityPoint[];
  activityTotal: number;
  statusShares: OverviewStatusShare[];
  statusTotal: number;
  categories: OverviewCategoryShare[];
  topCars: OverviewTopCar[];
  fleet: OverviewFleetInventory;
  recentBookings: OverviewBookingRow[];
};

const CLASS_COLORS = [
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

const CLASS_LABELS: Record<CarClass, string> = {
  economy: "Economy",
  compact: "Compact",
  sedan: "Sedan",
  suv: "SUV",
  luxury: "Luxury",
  sports: "Sports",
  van: "Van",
};

type PaidBookingRow = PaidRow & {
  customer_id: string | null;
  car_id: string | null;
};

type CarRel = { name?: string; class?: CarClass };

type CreatedBookingRow = {
  id: string;
  created_at: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  total_cents: number;
  amount_paid_cents: number | null;
  customer_id: string | null;
  car_id: string | null;
  reference_code: string;
  driver_full_name: string | null;
  rental_days: number;
  car: CarRel | CarRel[] | null;
};

function unwrapCar(car: CreatedBookingRow["car"]): CarRel | null {
  if (!car) return null;
  return Array.isArray(car) ? (car[0] ?? null) : car;
}

function emptyKpi(
  label: string,
  value = "0",
  hint = "vs prior period",
  extras?: Pick<OverviewKpi, "href" | "attention">
): OverviewKpi {
  return {
    label,
    value,
    raw: 0,
    deltaLabel: "—",
    deltaPositive: null,
    hint,
    ...extras,
  };
}

function kpiFrom(
  label: string,
  value: string,
  raw: number,
  delta: number | null,
  hint: string,
  extras?: Pick<OverviewKpi, "href" | "attention">
): OverviewKpi {
  return {
    label,
    value,
    raw,
    deltaLabel: formatDeltaPct(delta),
    deltaPositive: delta === null ? null : delta >= 0,
    hint,
    ...extras,
  };
}

function fleetInventory(cars: Car[]): OverviewFleetInventory {
  const available = cars.filter((c) => c.status === "available").length;
  const maintenance = cars.filter((c) => c.status === "maintenance").length;
  const retired = cars.filter((c) => c.status === "retired").length;
  const total = cars.length || 1;
  return {
    available,
    maintenance,
    retired,
    availablePercent: Math.round((available / total) * 100),
  };
}

function topCarsFromFleet(cars: Car[]): {
  categories: OverviewCategoryShare[];
  topCars: OverviewTopCar[];
} {
  const published = cars.filter((c) => c.is_published);
  const byClass = new Map<string, number>();
  for (const c of published) {
    byClass.set(c.class, (byClass.get(c.class) ?? 0) + 1);
  }
  const classTotal = published.length || 1;
  const categories = [...byClass.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({
      name: CLASS_LABELS[name as CarClass] ?? name,
      share: Math.round((count / classTotal) * 100),
      color: CLASS_COLORS[i % CLASS_COLORS.length],
    }));

  const topCars = [...published]
    .sort((a, b) => b.daily_rate_cents - a.daily_rate_cents)
    .slice(0, 3)
    .map((c) => ({
      name: c.name,
      category: CLASS_LABELS[c.class],
      share: "—",
      sales: formatMoney(0),
    }));

  return { categories, topCars };
}

function emptyOverview(period: OverviewPeriod, cars: Car[]): AdminOverview {
  const range = getOverviewPeriodRange(period);
  const fleet = fleetInventory(cars);
  const { categories, topCars } = topCarsFromFleet(cars);
  const days = 30;
  const series = bucketPaidByDay([], { days, now: new Date() });

  return {
    demo: true,
    period,
    periodLabel: range.label,
    kpis: {
      revenue: emptyKpi("Total revenue", formatMoney(0)),
      bookings: emptyKpi("Bookings"),
      unpaid: emptyKpi("Unpaid holds", "0", "checkout holds", {
        attention: false,
        href: "/admin/bookings?status=pending&payment=unpaid",
      }),
      customers: emptyKpi("Customers"),
      average: emptyKpi("Average booking", formatMoney(0)),
      fleetAvailable: kpiFrom(
        "Fleet available",
        `${fleet.availablePercent}%`,
        fleet.availablePercent,
        null,
        `${fleet.available} of ${cars.length} cars`
      ),
    },
    revenueSeries: series.map((p) => ({
      period: p.date,
      revenue: p.revenueCents,
      bookings: p.count,
    })),
    activitySeries: series.map((p) => ({
      date: p.date,
      bookings: 0,
      unpaid: 0,
    })),
    activityTotal: 0,
    statusShares: [],
    statusTotal: 0,
    categories,
    topCars,
    fleet,
    recentBookings: [],
  };
}

function inRange(iso: string | null | undefined, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= start.getTime() && t < end.getTime();
}

function sumRevenue(rows: PaidRow[]): number {
  return rows.reduce((s, r) => s + (r.amount_paid_cents ?? r.total_cents ?? 0), 0);
}

function buildRevenueSeries(
  paid: PaidRow[],
  days: number,
  now: Date
): OverviewChartPoint[] {
  return bucketPaidByDay(paid, { days, now }).map((p) => ({
    period: p.date,
    revenue: p.revenueCents,
    bookings: p.count,
  }));
}

function buildActivitySeries(
  created: CreatedBookingRow[],
  days: number,
  now: Date
): OverviewActivityPoint[] {
  const dense: AdminPaidDailyPoint[] = bucketPaidByDay([], { days, now });
  const byDay = new Map(dense.map((p) => [p.date, { bookings: 0, unpaid: 0 }]));

  for (const row of created) {
    const key = row.created_at.slice(0, 10);
    const bucket = byDay.get(key);
    if (!bucket) continue;
    bucket.bookings += 1;
    if (row.payment_status === "unpaid" && row.status === "pending") {
      bucket.unpaid += 1;
    }
  }

  return dense.map((p) => ({
    date: p.date,
    bookings: byDay.get(p.date)?.bookings ?? 0,
    unpaid: byDay.get(p.date)?.unpaid ?? 0,
  }));
}

export async function getAdminOverview(
  period: OverviewPeriod = "last-30-days"
): Promise<AdminOverview> {
  const fleetRepo = await getFleetRepo();
  const cars = await fleetRepo.listAllCars();

  if (!isSupabaseConfigured() || fleetRepo.mode === "demo") {
    return emptyOverview(period, cars);
  }

  const range = getOverviewPeriodRange(period);
  const now = new Date();
  const supabase = await createClient();

  // Fetch a wide window so series + prev period comparisons work without extra round-trips.
  const seriesSince = new Date(now);
  seriesSince.setUTCDate(seriesSince.getUTCDate() - 90);

  const [paidRes, createdRes, recentRes, unpaidRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("paid_at, amount_paid_cents, total_cents, customer_id, car_id")
      .eq("payment_status", "paid")
      .gte("paid_at", seriesSince.toISOString()),
    supabase
      .from("bookings")
      .select(
        "id, created_at, status, payment_status, total_cents, amount_paid_cents, customer_id, car_id, reference_code, driver_full_name, rental_days, car:cars(name, class)"
      )
      .gte("created_at", seriesSince.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select(
        "id, created_at, status, payment_status, total_cents, amount_paid_cents, customer_id, car_id, reference_code, driver_full_name, rental_days, car:cars(name, class)"
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("payment_status", "unpaid"),
  ]);

  if (paidRes.error) console.error(paidRes.error);
  if (createdRes.error) console.error(createdRes.error);
  if (recentRes.error) console.error(recentRes.error);
  if (unpaidRes.error) console.error(unpaidRes.error);

  const paidAll = (paidRes.data ?? []) as PaidBookingRow[];
  const createdAll = (createdRes.data ?? []) as CreatedBookingRow[];
  const recentAll = (recentRes.data ?? []) as CreatedBookingRow[];

  const paidPeriod = paidAll.filter((r) => inRange(r.paid_at, range.start, range.end));
  const paidPrev = paidAll.filter((r) =>
    inRange(r.paid_at, range.prevStart, range.prevEnd)
  );
  const createdPeriod = createdAll.filter((r) =>
    inRange(r.created_at, range.start, range.end)
  );
  const createdPrev = createdAll.filter((r) =>
    inRange(r.created_at, range.prevStart, range.prevEnd)
  );

  const revenueCents = sumRevenue(paidPeriod);
  const prevRevenue = sumRevenue(paidPrev);
  const bookingCount = createdPeriod.length;
  const prevBookingCount = createdPrev.length;

  const customers = new Set(
    createdPeriod.map((r) => r.customer_id).filter(Boolean) as string[]
  ).size;
  const prevCustomers = new Set(
    createdPrev.map((r) => r.customer_id).filter(Boolean) as string[]
  ).size;

  const avgOrder =
    paidPeriod.length > 0 ? Math.round(revenueCents / paidPeriod.length) : 0;
  const prevAvg =
    paidPrev.length > 0 ? Math.round(prevRevenue / paidPrev.length) : 0;

  const unpaidPending = unpaidRes.count ?? 0;

  const fleet = fleetInventory(cars);

  // Top cars by paid revenue in period
  const carRevenue = new Map<string, { cents: number; count: number }>();
  for (const row of paidPeriod) {
    if (!row.car_id) continue;
    const cur = carRevenue.get(row.car_id) ?? { cents: 0, count: 0 };
    cur.cents += row.amount_paid_cents ?? row.total_cents ?? 0;
    cur.count += 1;
    carRevenue.set(row.car_id, cur);
  }
  const carById = new Map(cars.map((c) => [c.id, c]));
  const rankedCars = [...carRevenue.entries()]
    .sort((a, b) => b[1].cents - a[1].cents)
    .slice(0, 3);
  const topRevenueTotal =
    rankedCars.reduce((s, [, v]) => s + v.cents, 0) || revenueCents || 1;

  let topCars: OverviewTopCar[];
  let categories: OverviewCategoryShare[];

  if (rankedCars.length === 0) {
    const fallback = topCarsFromFleet(cars);
    topCars = fallback.topCars;
    categories = fallback.categories;
  } else {
    topCars = rankedCars.map(([id, v]) => {
      const car = carById.get(id);
      return {
        name: car?.name ?? "Unknown car",
        category: car ? CLASS_LABELS[car.class] : "—",
        share: `${Math.round((v.cents / topRevenueTotal) * 100)}%`,
        sales: formatMoney(v.cents),
      };
    });

    const classRev = new Map<string, number>();
    for (const [id, v] of carRevenue) {
      const car = carById.get(id);
      if (!car) continue;
      classRev.set(car.class, (classRev.get(car.class) ?? 0) + v.cents);
    }
    const classSum = [...classRev.values()].reduce((a, b) => a + b, 0) || 1;
    categories = [...classRev.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, cents], i) => ({
        name: CLASS_LABELS[name as CarClass] ?? name,
        share: Math.round((cents / classSum) * 100),
        color: CLASS_COLORS[i % CLASS_COLORS.length],
      }));
  }

  // Status mix for period
  const statusCounts = new Map<BookingStatus, number>();
  for (const row of createdPeriod) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
  }
  const prevStatusCounts = new Map<BookingStatus, number>();
  for (const row of createdPrev) {
    prevStatusCounts.set(row.status, (prevStatusCounts.get(row.status) ?? 0) + 1);
  }
  const statusOrder: BookingStatus[] = [
    "pending",
    "confirmed",
    "active",
    "completed",
    "cancelled",
  ];
  const statusTotal = createdPeriod.length || 1;
  const statusShares: OverviewStatusShare[] = statusOrder
    .filter((s) => (statusCounts.get(s) ?? 0) > 0)
    .map((status) => {
      const count = statusCounts.get(status) ?? 0;
      const prev = prevStatusCounts.get(status) ?? 0;
      const delta = percentChange(count, prev);
      return {
        name: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        visits: count.toLocaleString(),
        share: Math.round((count / statusTotal) * 100),
        change: formatDeltaPct(delta),
      };
    });

  const revenueSeries = buildRevenueSeries(paidAll, 30, now);
  const activitySeries = buildActivitySeries(createdAll, 30, now);
  const activityTotal = activitySeries.reduce((s, p) => s + p.bookings, 0);

  const recentBookings: OverviewBookingRow[] = recentAll.map((b) => ({
    id: b.id,
    reference: b.reference_code,
    date: b.created_at,
    customer: b.driver_full_name?.trim() || "Guest",
    payment: b.payment_status,
    status: b.status,
    total: formatMoney(b.amount_paid_cents ?? b.total_cents),
    totalCents: b.amount_paid_cents ?? b.total_cents,
    car: unwrapCar(b.car)?.name ?? "—",
    rentalDays: b.rental_days,
  }));

  return {
    demo: false,
    period,
    periodLabel: range.label,
    kpis: {
      revenue: kpiFrom(
        "Total revenue",
        formatMoney(revenueCents),
        revenueCents,
        percentChange(revenueCents, prevRevenue),
        "vs prior period"
      ),
      bookings: kpiFrom(
        "Bookings",
        bookingCount.toLocaleString(),
        bookingCount,
        percentChange(bookingCount, prevBookingCount),
        "created in period"
      ),
      customers: kpiFrom(
        "Customers",
        customers.toLocaleString(),
        customers,
        percentChange(customers, prevCustomers),
        "unique renters"
      ),
      average: kpiFrom(
        "Average booking",
        formatMoney(avgOrder),
        avgOrder,
        percentChange(avgOrder, prevAvg),
        "paid average"
      ),
      unpaid: kpiFrom(
        "Unpaid holds",
        unpaidPending.toLocaleString(),
        unpaidPending,
        null,
        unpaidPending > 0 ? "needs payment or expire" : "queue clear",
        {
          attention: unpaidPending > 0,
          href: "/admin/bookings?status=pending&payment=unpaid",
        }
      ),
      fleetAvailable: kpiFrom(
        "Fleet available",
        `${fleet.availablePercent}%`,
        fleet.availablePercent,
        null,
        `${fleet.available} ready · ${fleet.maintenance} service`
      ),
    },
    revenueSeries,
    activitySeries,
    activityTotal,
    statusShares,
    statusTotal: createdPeriod.length,
    categories,
    topCars,
    fleet,
    recentBookings,
  };
}
