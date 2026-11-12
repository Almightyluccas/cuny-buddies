import "server-only";

import { getDb } from "@/lib/db/client";

export interface Health {
  status: "ok" | "degraded";
  dbLatencyMs: number | null; // null when the DB is unreachable
  commit: string | null; // deployed commit, set by Vercel
}

const DB_TIMEOUT_MS = 5000;

export async function checkHealth(): Promise<Health> {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null;
  const start = performance.now();
  try {
    await getDb().command({ ping: 1 }, { timeoutMS: DB_TIMEOUT_MS });
    const dbLatencyMs = Math.round(performance.now() - start);
    return { status: "ok", dbLatencyMs, commit };
  } catch {
    return { status: "degraded", dbLatencyMs: null, commit };
  }
}
