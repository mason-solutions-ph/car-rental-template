export const OVERVIEW_PERIODS = [
  "this-month",
  "last-month",
  "last-30-days",
  "year-to-date",
] as const;

export type OverviewPeriod = (typeof OVERVIEW_PERIODS)[number];

export type PeriodRange = {
  start: Date;
  end: Date;
  /** Previous window of equal length, ending where `start` begins. */
  prevStart: Date;
  prevEnd: Date;
  label: string;
};

export function parseOverviewPeriod(value: string | undefined | null): OverviewPeriod {
  if (value && (OVERVIEW_PERIODS as readonly string[]).includes(value)) {
    return value as OverviewPeriod;
  }
  return "last-30-days";
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Inclusive-start, exclusive-end style ranges for overview filters.
 * `end` is "now" (or end of last month for last-month).
 */
export function getOverviewPeriodRange(
  period: OverviewPeriod,
  now = new Date()
): PeriodRange {
  const end = now;

  if (period === "this-month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const prevEnd = start;
    const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: "This month",
    };
  }

  if (period === "last-month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const endOfLast = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
    return {
      start,
      end: endOfLast,
      prevStart,
      prevEnd: start,
      label: "Last month",
    };
  }

  if (period === "year-to-date") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const dayCount = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    );
    const prevEnd = start;
    const prevStart = addUtcDays(start, -dayCount);
    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: "Year to date",
    };
  }

  // last-30-days
  const start = addUtcDays(startOfUtcDay(now), -29);
  const prevEnd = start;
  const prevStart = addUtcDays(start, -30);
  return {
    start,
    end,
    prevStart,
    prevEnd,
    label: "Last 30 days",
  };
}

/** Percent change current vs previous. null when previous is 0 and current is 0. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function formatDeltaPct(delta: number | null): string {
  if (delta === null) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}%`;
}
