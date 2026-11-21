import { connection } from "next/server";
import { checkHealth } from "@/lib/db/health";

// Uptime probe for the heartbeat workflow: 200 when the DB answers, else 503.
export async function GET() {
  await connection(); // never prerender or cache
  const health = await checkHealth();
  return Response.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
