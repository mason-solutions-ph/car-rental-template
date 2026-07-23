import { describe, expect, it } from "vitest";
import { holdRemaining } from "@/lib/admin/hold";

const created = "2026-07-24T12:00:00.000Z";
const createdMs = new Date(created).getTime();

describe("holdRemaining", () => {
  it("is full at creation time", () => {
    const r = holdRemaining(created, createdMs, 30);
    expect(r.fraction).toBe(1);
    expect(r.label).toBe("30m left");
  });

  it("depletes mid-window and rounds minutes up", () => {
    const r = holdRemaining(created, createdMs + 17.5 * 60_000, 30);
    expect(r.fraction).toBeCloseTo(12.5 / 30);
    expect(r.label).toBe("13m left");
  });

  it("is elapsed exactly at the hold boundary", () => {
    const r = holdRemaining(created, createdMs + 30 * 60_000, 30);
    expect(r.remainingMs).toBe(0);
    expect(r.fraction).toBe(0);
    expect(r.label).toBe("Hold elapsed");
  });

  it("clamps past-elapsed holds to zero", () => {
    const r = holdRemaining(created, createdMs + 90 * 60_000, 30);
    expect(r.remainingMs).toBe(0);
    expect(r.fraction).toBe(0);
  });

  it("clamps future created_at (clock skew) to a full bar", () => {
    const r = holdRemaining(created, createdMs - 5 * 60_000, 30);
    expect(r.fraction).toBe(1);
  });
});
