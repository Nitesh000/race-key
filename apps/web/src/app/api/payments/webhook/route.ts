import { handlePaymentEvent, type PaymentEvent } from "@/features/payments/handle-event";
import { getDb } from "@/lib/db";
import { dodo, paymentsEnabled } from "@/lib/payments";

export async function POST(req: Request) {
  if (!paymentsEnabled()) return new Response("payments are off", { status: 404 });
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  let event: PaymentEvent;
  try {
    event = dodo().webhooks.unwrap(body, { headers }) as unknown as PaymentEvent;
  } catch {
    return new Response("bad signature", { status: 401 });
  }
  const id = headers["webhook-id"] ?? "";
  if (!id) return new Response("missing webhook-id", { status: 400 });
  const result = await handlePaymentEvent(getDb(), id, event);
  return Response.json({ result });
}
