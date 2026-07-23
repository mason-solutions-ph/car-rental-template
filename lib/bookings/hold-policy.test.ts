import { describe, expect, it } from "vitest";
import {
  bookingBlocksInventory,
  holdCutoff,
  isActiveCheckoutHold,
  type HoldPolicyBooking,
} from "@/lib/bookings/hold-policy";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";

const now = new Date("2026-08-01T12:00:00.000Z");

function row(
  partial: Partial<HoldPolicyBooking> &
    Pick<HoldPolicyBooking, "status" | "payment_status">
): HoldPolicyBooking {
  return {
    created_at: "2026-08-01T11:50:00.000Z",
    ...partial,
  };
}

/** Case table shared with SQL `car_is_available` comments. */
const blockCases: {
  name: string;
  booking: HoldPolicyBooking;
  blocks: boolean;
  activeHold: boolean;
}[] = [
  {
    name: "confirmed always blocks",
    booking: row({
      status: "confirmed",
      payment_status: "paid",
      created_at: "2026-07-01T00:00:00.000Z",
    }),
    blocks: true,
    activeHold: false,
  },
  {
    name: "active always blocks",
    booking: row({
      status: "active",
      payment_status: "paid",
      created_at: "2026-07-01T00:00:00.000Z",
    }),
    blocks: true,
    activeHold: false,
  },
  {
    name: "pending paid blocks",
    booking: row({ status: "pending", payment_status: "paid" }),
    blocks: true,
    activeHold: false,
  },
  {
    name: "pending unpaid within hold blocks",
    booking: row({
      status: "pending",
      payment_status: "unpaid",
      created_at: "2026-08-01T11:50:00.000Z",
    }),
    blocks: true,
    activeHold: true,
  },
  {
    name: "pending unpaid past hold does not block",
    booking: row({
      status: "pending",
      payment_status: "unpaid",
      created_at: holdCutoff(now, CHECKOUT_HOLD_MINUTES).toISOString(),
    }),
    blocks: false,
    activeHold: false,
  },
  {
    name: "expired unpaid does not block",
    booking: row({
      status: "pending",
      payment_status: "expired",
      created_at: "2026-08-01T11:50:00.000Z",
    }),
    blocks: false,
    activeHold: false,
  },
  {
    name: "cancelled does not block",
    booking: row({
      status: "cancelled",
      payment_status: "unpaid",
      created_at: "2026-08-01T11:50:00.000Z",
    }),
    blocks: false,
    activeHold: false,
  },
  {
    name: "completed does not block",
    booking: row({
      status: "completed",
      payment_status: "paid",
      created_at: "2026-07-01T00:00:00.000Z",
    }),
    blocks: false,
    activeHold: false,
  },
];

describe("hold-policy case table", () => {
  for (const c of blockCases) {
    it(c.name, () => {
      expect(bookingBlocksInventory(c.booking, now)).toBe(c.blocks);
      expect(isActiveCheckoutHold(c.booking, now)).toBe(c.activeHold);
    });
  }
});

describe("holdCutoff", () => {
  it("is holdMinutes before now", () => {
    const cut = holdCutoff(now, 30);
    expect(cut.toISOString()).toBe("2026-08-01T11:30:00.000Z");
  });
});
