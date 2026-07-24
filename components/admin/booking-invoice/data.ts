import type { AdminBookingDetail } from "@/lib/admin/queries";
import { SITE_NAME } from "@/lib/constants";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";

/** Studio Invoice paper dimensions (letter-ish px). */
export const BOOKING_PAPER_WIDTH = 816;
export const BOOKING_PAPER_HEIGHT = 1056;
export const BOOKING_PAPER_SCALE = 0.6;

export type BookingPaperLine = {
  id: string;
  description: string;
  quantity: number;
  unitPriceLabel: string;
  lineTotalLabel: string;
};

export type BookingPaperModel = {
  referenceNumber: string;
  issuedLabel: string;
  pickupLabel: string;
  dropoffLabel: string;
  paymentStatus: string;
  bookingStatus: string;
  from: {
    name: string;
    email: string;
    phone: string;
    website: string;
    addressLines: string[];
  };
  to: {
    name: string;
    phone: string;
    license: string | null;
    locationLines: string[];
  };
  paymentAccountName: string;
  routingNumber: string;
  items: BookingPaperLine[];
  subtotalLabel: string;
  feesLabel: string;
  totalLabel: string;
  amountPaidLabel: string;
  customerNote: string | null;
};

function locLine(
  loc: { name: string | null; city: string | null } | null | undefined,
  kind: string
) {
  if (!loc?.name && !loc?.city) return null;
  const place = [loc?.name, loc?.city].filter(Boolean).join(", ");
  return `${kind}: ${place}`;
}

/** Map a live booking into the Studio Invoice paper model. */
export function bookingToPaperModel(
  booking: AdminBookingDetail
): BookingPaperModel {
  const carName = booking.car?.name?.trim() || "Vehicle";
  const renter =
    booking.driver_full_name?.trim() ||
    booking.customer?.full_name?.trim() ||
    "Guest renter";

  const locationLines = [
    locLine(booking.pickup_location, "Pickup"),
    locLine(booking.dropoff_location, "Drop-off"),
  ].filter(Boolean) as string[];

  const items: BookingPaperLine[] = [
    {
      id: "rental",
      description: `${carName} rental`,
      quantity: booking.rental_days,
      unitPriceLabel: formatMoney(booking.daily_rate_cents),
      lineTotalLabel: formatMoney(booking.subtotal_cents),
    },
  ];

  if (booking.fees_cents > 0) {
    items.push({
      id: "fees",
      description: "Fees",
      quantity: 1,
      unitPriceLabel: formatMoney(booking.fees_cents),
      lineTotalLabel: formatMoney(booking.fees_cents),
    });
  }

  return {
    referenceNumber: booking.reference_code,
    issuedLabel: formatDateTime(booking.created_at),
    pickupLabel: formatDateTime(booking.pickup_at),
    dropoffLabel: formatDateTime(booking.dropoff_at),
    paymentStatus: booking.payment_status,
    bookingStatus: booking.status,
    from: {
      name: SITE_NAME,
      email: "ops@aetherdrive.ph",
      phone: "+63 2 8000 0000",
      website: "aetherdrive.ph",
      addressLines: ["Metro Manila", "Philippines"],
    },
    to: {
      name: renter,
      phone: booking.driver_phone?.trim() || "—",
      license: booking.driver_license_number?.trim() || null,
      locationLines,
    },
    paymentAccountName: "PayMongo Checkout",
    routingNumber:
      booking.paymongo_payment_id?.trim() ||
      booking.paymongo_checkout_session_id?.trim() ||
      "—",
    items,
    subtotalLabel: formatMoney(booking.subtotal_cents),
    feesLabel: formatMoney(booking.fees_cents),
    totalLabel: formatMoney(booking.total_cents),
    amountPaidLabel: formatMoney(booking.amount_paid_cents ?? 0),
    customerNote: booking.customer_note?.trim() || null,
  };
}
