import { connection } from "next/server";
import { currentUserId } from "@/lib/auth";
import { getSchedule, saveSchedule } from "@/lib/db/schedules";
import { scheduleSchema } from "@/lib/schedule/model";

const MAX_BYTES = 300_000; // extracted text is capped at 200 KB

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  await connection();
  const userId = await currentUserId();
  if (!userId) return json({ error: "Sign in to load your schedule." }, 401);
  return json({ schedule: await getSchedule(userId) });
}

// Saves a schedule parsed in the browser. The client is untrusted, so the
// whole payload is validated here.
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return json({ error: "Sign in to save your schedule." }, 401);

  const body = await request.text();
  if (body.length > MAX_BYTES) return json({ error: "Schedule is too large." }, 413);

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  const parsed = scheduleSchema.safeParse(data);
  if (!parsed.success) {
    return json({ error: "Invalid schedule.", issues: parsed.error.issues.slice(0, 10) }, 400);
  }

  await saveSchedule(userId, parsed.data);
  return json({ ok: true });
}
