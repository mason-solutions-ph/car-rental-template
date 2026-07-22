import { NextResponse } from "next/server";
import { handlePaymongoWebhook } from "@/lib/paymongo/handle-webhook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paymongo-signature");

  try {
    const result = await handlePaymongoWebhook(rawBody, signature);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    return NextResponse.json({
      received: true,
      applied: result.applied,
    });
  } catch (e) {
    console.error("PayMongo webhook error", e);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
