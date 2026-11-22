import { connection } from "next/server";
import { currentUserId } from "@/lib/auth";
import { getSchedule, saveSchedule } from "@/lib/db/schedules";
import { scheduleSchema } from "@/lib/schedule/model";

// The 200,000-character text field can take up to 6 bytes per character as
// JSON (control characters are escaped as \u00XX), plus the other fields.
const MAX_BYTES = 1_500_000;

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

  const body = await readLimited(request, MAX_BYTES);
  if (body === null) return json({ error: "Schedule is too large." }, 413);

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

// The body as text, or null once it passes `max` bytes. Stops reading there
// instead of buffering an oversized request.
async function readLimited(request: Request, max: number): Promise<string | null> {
  if (Number(request.headers.get("content-length") ?? 0) > max) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(bytes);
}
