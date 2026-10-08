import { randomPassage } from "@race-key/passages";
import { toClientPassage } from "@/features/passages/types";

export function GET(req: Request) {
  const url = new URL(req.url);
  const wpm = Number(url.searchParams.get("wpm"));
  const exclude = url.searchParams.get("exclude");
  const passage = randomPassage({
    wpm: Number.isFinite(wpm) && wpm > 0 ? wpm : undefined,
    exclude: exclude ? new Set([exclude]) : undefined,
  });
  return Response.json(toClientPassage(passage), { headers: { "cache-control": "no-store" } });
}
