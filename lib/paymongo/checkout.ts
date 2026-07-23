import { paymongoFetch } from "@/lib/paymongo/client";
import type { PaymongoCheckoutSession } from "@/lib/paymongo/types";

export type CreateCheckoutInput = {
  bookingId: string;
  referenceCode: string;
  amountCentavos: number;
  carName: string;
  rentalDays: number;
  successUrl: string;
  cancelUrl: string;
};

export async function createCheckoutSession(input: CreateCheckoutInput) {
  const payload = {
    data: {
      attributes: {
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        description: `Booking ${input.referenceCode}`,
        line_items: [
          {
            currency: "PHP",
            amount: input.amountCentavos,
            name: input.carName,
            quantity: 1,
            description: `${input.rentalDays} day(s) · ${input.referenceCode}`,
          },
        ],
        payment_method_types: ["qrph"],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: {
          booking_id: input.bookingId,
          reference_code: input.referenceCode,
        },
      },
    },
  };

  const json = await paymongoFetch<PaymongoCheckoutSession>(
    "/v1/checkout_sessions",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return {
    id: json.data.id,
    checkoutUrl: json.data.attributes.checkout_url,
  };
}

export async function retrieveCheckoutSession(sessionId: string) {
  return paymongoFetch<PaymongoCheckoutSession>(
    `/v1/checkout_sessions/${sessionId}`
  );
}
