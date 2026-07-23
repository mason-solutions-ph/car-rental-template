import { describe, expect, it } from "vitest";
import {
  carImageObjectPath,
  MAX_CAR_IMAGE_BYTES,
  validateCarImageFile,
} from "@/lib/admin/upload-image";

describe("validateCarImageFile", () => {
  it("accepts a normal jpeg", () => {
    const r = validateCarImageFile({
      type: "image/jpeg",
      size: 120_000,
      name: "hero.jpg",
    });
    expect(r).toEqual({ ok: true, ext: "jpg", contentType: "image/jpeg" });
  });

  it("rejects oversized files", () => {
    const r = validateCarImageFile({
      type: "image/png",
      size: MAX_CAR_IMAGE_BYTES + 1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/5MB/i);
  });

  it("rejects non-image types", () => {
    const r = validateCarImageFile({ type: "application/pdf", size: 1000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/JPG|PNG|WebP/i);
  });

  it("rejects empty files", () => {
    const r = validateCarImageFile({ type: "image/webp", size: 0 });
    expect(r.ok).toBe(false);
  });
});

describe("carImageObjectPath", () => {
  it("prefixes heroes/ and keeps extension", () => {
    expect(carImageObjectPath("png", "abc-123")).toBe("heroes/abc-123.png");
  });
});
