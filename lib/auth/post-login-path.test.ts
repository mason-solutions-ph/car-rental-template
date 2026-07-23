import { describe, expect, it } from "vitest";
import { defaultPostLoginPath } from "@/lib/auth/post-login-path";

describe("defaultPostLoginPath", () => {
  it("sends admins to the admin dashboard", () => {
    expect(defaultPostLoginPath("admin")).toBe("/admin");
  });

  it("sends customers to account bookings", () => {
    expect(defaultPostLoginPath("customer")).toBe("/account/bookings");
    expect(defaultPostLoginPath(null)).toBe("/account/bookings");
    expect(defaultPostLoginPath(undefined)).toBe("/account/bookings");
  });
});
