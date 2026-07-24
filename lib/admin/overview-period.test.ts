import { describe, expect, it } from "vitest";
import {
  formatDeltaPct,
  getOverviewPeriodRange,
  parseOverviewPeriod,
  percentChange,
} from "./overview-period";

describe("parseOverviewPeriod", () => {
  it("defaults to last-30-days", () => {
    expect(parseOverviewPeriod(undefined)).toBe("last-30-days");
    expect(parseOverviewPeriod("nope")).toBe("last-30-days");
  });

  it("accepts known values", () => {
    expect(parseOverviewPeriod("this-month")).toBe("this-month");
  });
});

describe("getOverviewPeriodRange", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  it("builds last-30-days ending today", () => {
    const r = getOverviewPeriodRange("last-30-days", now);
    expect(r.start.toISOString().slice(0, 10)).toBe("2026-06-16");
    expect(r.label).toBe("Last 30 days");
  });

  it("builds this-month from the 1st", () => {
    const r = getOverviewPeriodRange("this-month", now);
    expect(r.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(r.prevStart.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("builds last-month as full prior month", () => {
    const r = getOverviewPeriodRange("last-month", now);
    expect(r.start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });
});

describe("percentChange", () => {
  it("handles zeros and growth", () => {
    expect(percentChange(0, 0)).toBeNull();
    expect(percentChange(10, 0)).toBe(100);
    expect(percentChange(15, 10)).toBe(50);
    expect(percentChange(8, 10)).toBe(-20);
  });
});

describe("formatDeltaPct", () => {
  it("formats", () => {
    expect(formatDeltaPct(null)).toBe("—");
    expect(formatDeltaPct(12.5)).toBe("+12.5%");
    expect(formatDeltaPct(-3)).toBe("-3%");
  });
});
