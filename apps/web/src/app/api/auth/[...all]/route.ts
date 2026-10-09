import { toNextJsHandler } from "better-auth/next-js";
import { authEnabled, getAuth } from "@/lib/auth";

const disabled = () => Response.json({ error: "accounts are not configured" }, { status: 503 });

export async function GET(req: Request) {
  if (!authEnabled()) return disabled();
  return toNextJsHandler(getAuth()).GET(req);
}

export async function POST(req: Request) {
  if (!authEnabled()) return disabled();
  return toNextJsHandler(getAuth()).POST(req);
}
