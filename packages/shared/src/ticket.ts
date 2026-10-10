import { z } from "zod";

export const ticketSchema = z.object({
  sub: z.string().min(1).max(64),
  uid: z.string().nullable(),
  name: z.string().min(1).max(32),
  level: z.number().int().min(1),
  skin: z.string().max(40),
  exp: z.number().int(),
});
export type Ticket = z.infer<typeof ticketSchema>;

export const TICKET_TTL_MS = 10 * 60 * 1000;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signTicket(data: Omit<Ticket, "exp">, secret: string, now = Date.now()) {
  const body = toBase64Url(encoder.encode(JSON.stringify({ ...data, exp: now + TICKET_TTL_MS })));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifyTicket(
  token: string,
  secret: string,
  now = Date.now(),
): Promise<Ticket | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await key(secret),
      fromBase64Url(sig),
      encoder.encode(body),
    );
    if (!ok) return null;
    const parsed = ticketSchema.safeParse(
      JSON.parse(new TextDecoder().decode(fromBase64Url(body))),
    );
    if (!parsed.success || parsed.data.exp < now) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export const DEV_SECRET = "race-key-dev-secret";
