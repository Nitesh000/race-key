import { describe, expect, it } from "vitest";
import { parseClientMessage } from "./protocol";

describe("parseClientMessage", () => {
  it("accepts valid messages", () => {
    expect(parseClientMessage('{"t":"progress","pos":12}')).toEqual({ t: "progress", pos: 12 });
    expect(parseClientMessage('{"t":"start"}')).toEqual({ t: "start" });
  });

  it("rejects junk", () => {
    expect(parseClientMessage("{")).toBeNull();
    expect(parseClientMessage('{"t":"progress","pos":-1}')).toBeNull();
    expect(parseClientMessage('{"t":"nope"}')).toBeNull();
    expect(parseClientMessage(new ArrayBuffer(4))).toBeNull();
  });
});
