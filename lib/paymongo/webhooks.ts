import { createHmac, timingSafeEqual } from "crypto";
import type { PaymongoWebhookEvent } from "@/lib/paymongo/types";

/**
 * Verify PayMongo webhook signature.
 * Header typically: Paymongo-Signature: t=timestamp,te=test_sig,li=live_sig
 * @see https://developers.paymongo.com/docs/creating-webhook
 */
export function verifyPaymongoSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    })
  );

  const timestamp = parts.t;
  const testSig = parts.te;
  const liveSig = parts.li;
  if (!timestamp) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const candidates = [testSig, liveSig].filter(Boolean);
  return candidates.some((sig) => {
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(sig);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

export function parsePaymongoEvent(rawBody: string): PaymongoWebhookEvent {
  return JSON.parse(rawBody) as PaymongoWebhookEvent;
}
