import { describe, expect, it } from "vitest";
import { EMPTY_VALUE, orEmpty } from "@/lib/format/empty";

describe("orEmpty", () => {
  it("falls back for null and undefined", () => {
    expect(orEmpty(null)).toBe(EMPTY_VALUE);
    expect(orEmpty(undefined)).toBe(EMPTY_VALUE);
  });

  it("falls back for blank and whitespace-only strings", () => {
    expect(orEmpty("")).toBe(EMPTY_VALUE);
    expect(orEmpty("   ")).toBe(EMPTY_VALUE);
    expect(orEmpty("\t\n")).toBe(EMPTY_VALUE);
  });

  it("passes through a real string", () => {
    expect(orEmpty("Toyota Vios")).toBe("Toyota Vios");
  });

  it("preserves meaningful whitespace inside a value", () => {
    expect(orEmpty(" Toyota Vios ")).toBe(" Toyota Vios ");
  });

  it("applies the formatter when a value is present", () => {
    expect(orEmpty(4200, (n) => `P${n.toLocaleString("en-PH")}`)).toBe("P4,200");
  });

  it("skips the formatter when the value is absent", () => {
    const format = (n: number) => `P${n}`;
    expect(orEmpty<number>(null, format)).toBe(EMPTY_VALUE);
  });

  // Absence is null/undefined/blank only, never falsiness: a zero total or a
  // zero count is a real value and must render as one.
  it("does not treat zero as absent", () => {
    expect(orEmpty(0, String)).toBe("0");
  });

  // Locks the design rule: em-dashes are banned from admin output.
  it("never emits an em-dash or en-dash", () => {
    expect(EMPTY_VALUE).not.toMatch(/[–—]/);
    expect(orEmpty(null)).not.toMatch(/[–—]/);
    expect(orEmpty("")).not.toMatch(/[–—]/);
  });
});
