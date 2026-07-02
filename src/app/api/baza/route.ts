import { getBaza } from "@/lib/data";

// Polled by the client every 30s — must never be cached and never crash.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const baza = await getBaza({ fresh: true });
    return Response.json(baza);
  } catch (err) {
    // Graceful failure: the client keeps its last-known data on an error flag.
    console.error("[api/baza] fetch failed:", err);
    return Response.json({ error: "fetch_failed" }, { status: 200 });
  }
}
