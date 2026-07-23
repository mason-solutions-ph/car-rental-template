import { describe, expect, it } from "vitest";
import { customerBookingAffordances } from "@/lib/bookings/affordances";

const now = new Date("2026-08-01T12:00:00.000Z");

describe("customerBookingAffordances", () => {
  it("unpaid pending: pay and cancel", () => {
    expect(
      customerBookingAffordances(
        {
          status: "pending",
          payment_status: "unpaid",
          pickup_at: "2026-08-10T10:00:00.000Z",
        },
        now
      )
    ).toEqual({ canPay: true, canCancel: true });
  });

  it("paid confirmed far from pickup: cancel only", () => {
    expect(
      customerBookingAffordances(
        {
          status: "confirmed",
          payment_status: "paid",
          pickup_at: "2026-08-10T10:00:00.000Z",
        },
        now
      )
    ).toEqual({ canPay: false, canCancel: true });
  });

  it("paid confirmed near pickup: neither", () => {
    expect(
      customerBookingAffordances(
        {
          status: "confirmed",
          payment_status: "paid",
          pickup_at: "2026-08-01T20:00:00.000Z",
        },
        now
      )
    ).toEqual({ canPay: false, canCancel: false });
  });

  it("active paid: neither", () => {
    expect(
      customerBookingAffordances(
        {
          status: "active",
          payment_status: "paid",
          pickup_at: "2026-08-10T10:00:00.000Z",
        },
        now
      )
    ).toEqual({ canPay: false, canCancel: false });
  });
});
