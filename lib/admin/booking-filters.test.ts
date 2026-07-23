import { describe, expect, it } from "vitest";
import {
  adminBookingsFilterQuery,
  parseAdminBookingFilters,
} from "@/lib/admin/booking-filters";

describe("parseAdminBookingFilters", () => {
  it("accepts valid status and payment", () => {
    expect(
      parseAdminBookingFilters({ status: "confirmed", payment: "paid" })
    ).toEqual({ status: "confirmed", paymentStatus: "paid" });
  });

  it("ignores invalid values", () => {
    expect(
      parseAdminBookingFilters({ status: "nope", payment: "maybe" })
    ).toEqual({ status: undefined, paymentStatus: undefined });
  });
});

describe("adminBookingsFilterQuery", () => {
  it("builds query string", () => {
    expect(
      adminBookingsFilterQuery({
        status: "pending",
        paymentStatus: "unpaid",
      })
    ).toBe("?status=pending&payment=unpaid");
  });

  it("returns empty when no filters", () => {
    expect(adminBookingsFilterQuery({})).toBe("");
  });
});
