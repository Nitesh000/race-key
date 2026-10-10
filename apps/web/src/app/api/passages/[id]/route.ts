import { getPassage } from "@race-key/passages";
import { toClientPassage } from "@/features/passages/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const passage = getPassage((await params).id);
  if (!passage) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(toClientPassage(passage), {
    headers: { "cache-control": "public, max-age=86400" },
  });
}
