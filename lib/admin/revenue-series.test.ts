import { describe, expect, it } from "vitest";
import { bucketPaidByDay } from "@/lib/admin/revenue-series";

const now = new Date("2026-07-24T10:30:00.000Z");

describe("bucketPaidByDay", () => {
  it("returns dense zero-filled series, oldest first, ending today (UTC)", () => {
    const points = bucketPaidByDay([], { days: 14, now });
    expect(points).toHaveLength(14);
    expect(points[0].date).toBe("2026-07-11");
    expect(points[13].date).toBe("2026-07-24");
    expect(points.every((p) => p.count === 0 && p.revenueCents === 0)).toBe(
      true
    );
  });

  it("buckets by UTC calendar day", () => {
    const points = bucketPaidByDay(
      [
        {
          paid_at: "2026-07-23T23:59:59.000Z",
          amount_paid_cents: 100,
          total_cents: null,
        },
        {
          paid_at: "2026-07-24T00:00:00.000Z",
          amount_paid_cents: 200,
          total_cents: null,
        },
      ],
      { days: 2, now }
    );
    expect(points[0]).toEqual({
      date: "2026-07-23",
      count: 1,
      revenueCents: 100,
    });
    expect(points[1]).toEqual({
      date: "2026-07-24",
      count: 1,
      revenueCents: 200,
    });
  });

  it("falls back to total_cents when amount_paid_cents is null", () => {
    const points = bucketPaidByDay(
      [{ paid_at: "2026-07-24T05:00:00.000Z", amount_paid_cents: null, total_cents: 4200 }],
      { days: 1, now }
    );
    expect(points[0].revenueCents).toBe(4200);
  });

  it("drops rows without paid_at or outside the window", () => {
    const points = bucketPaidByDay(
      [
        { paid_at: null, amount_paid_cents: 100, total_cents: null },
        {
          paid_at: "2026-07-01T00:00:00.000Z",
          amount_paid_cents: 100,
          total_cents: null,
        },
        {
          paid_at: "2026-07-25T00:00:00.000Z",
          amount_paid_cents: 100,
          total_cents: null,
        },
      ],
      { days: 3, now }
    );
    expect(points.every((p) => p.count === 0)).toBe(true);
  });

  it("aggregates multiple rows on the same day", () => {
    const points = bucketPaidByDay(
      [
        {
          paid_at: "2026-07-24T01:00:00.000Z",
          amount_paid_cents: 1000,
          total_cents: null,
        },
        {
          paid_at: "2026-07-24T02:00:00.000Z",
          amount_paid_cents: null,
          total_cents: 500,
        },
      ],
      { days: 1, now }
    );
    expect(points[0]).toEqual({
      date: "2026-07-24",
      count: 2,
      revenueCents: 1500,
    });
  });

  it("returns empty for non-positive day counts", () => {
    expect(bucketPaidByDay([], { days: 0, now })).toEqual([]);
  });
});
