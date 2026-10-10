import { describe, expect, it } from "vitest";
import { signTicket, TICKET_TTL_MS, verifyTicket } from "./ticket";

const player = { sub: "u1", uid: "u1", name: "BraveOtter", level: 3, skin: "hatchback" };

describe("tickets", () => {
  it("round trips", async () => {
    const t = await signTicket(player, "s3cret", 1000);
    expect(await verifyTicket(t, "s3cret", 2000)).toEqual({ ...player, exp: 1000 + TICKET_TTL_MS });
  });

  it("rejects a wrong secret, a tampered body and an expired ticket", async () => {
    const t = await signTicket(player, "s3cret", 1000);
    expect(await verifyTicket(t, "other", 2000)).toBeNull();
    const [, sig] = t.split(".");
    const forged = btoa(JSON.stringify({ ...player, name: "admin", exp: 9e15 })).replace(/=+$/, "");
    expect(await verifyTicket(`${forged}.${sig}`, "s3cret", 2000)).toBeNull();
    expect(await verifyTicket(t, "s3cret", 1000 + TICKET_TTL_MS + 1)).toBeNull();
    expect(await verifyTicket("garbage", "s3cret")).toBeNull();
  });
});
