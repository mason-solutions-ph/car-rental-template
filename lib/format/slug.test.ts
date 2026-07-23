import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/format/slug";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Toyota Vios 2024")).toBe("toyota-vios-2024");
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("  BMW  X5 — M Sport!! ")).toBe("bmw-x5-m-sport");
  });

  it("returns empty string for blank input", () => {
    expect(slugify("   ")).toBe("");
    expect(slugify("")).toBe("");
  });

  it("handles accented characters", () => {
    expect(slugify("Café Niño")).toBe("cafe-nino");
  });
});
