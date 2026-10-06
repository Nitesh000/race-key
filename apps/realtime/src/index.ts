export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ ok: true });
    return new Response("race-key realtime", { status: 200 });
  },
} satisfies ExportedHandler;
