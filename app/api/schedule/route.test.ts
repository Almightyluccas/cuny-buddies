import { MongoMemoryServer } from "mongodb-memory-server";
import type { MongoClient } from "mongodb";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/lib/db/client";
import { COLLECTIONS, ensureSchema } from "@/lib/db/schema";
import { emptySchedule, type Schedule } from "@/lib/schedule/model";

const auth = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@/lib/auth", () => ({ currentUserId: async () => auth.userId }));
vi.mock("next/server", () => ({ connection: async () => {} }));

const { GET, POST } = await import("@/app/api/schedule/route");

let server: MongoMemoryServer;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri();
  await ensureSchema(getDb());
});

afterAll(async () => {
  await (globalThis as unknown as { mongoClient: MongoClient }).mongoClient.close();
  await server.stop();
});

beforeEach(async () => {
  auth.userId = "workos_user_1";
  await getDb().collection(COLLECTIONS.schedules).deleteMany({});
});

const schedule: Schedule = {
  ...emptySchedule("schedule-builder"),
  courses: [
    {
      code: "CSC 30400",
      startDate: "2026-08-28",
      endDate: "2026-12-21",
      meetings: [{ days: ["Mon", "Wed"], start: 750, end: 825, location: "Shepard Hall Rm S-376" }],
    },
  ],
  addedFree: [{ day: "Fri", start: 600, end: 660 }],
};

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/schedule", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

describe("/api/schedule", () => {
  it("saves a valid schedule and returns it", async () => {
    expect((await post(schedule)).status).toBe(200);
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect((await res.json()).schedule).toEqual(schedule);

    // Saving again replaces it rather than adding a second document.
    await post({ ...schedule, addedFree: [] });
    expect(await getDb().collection(COLLECTIONS.schedules).countDocuments()).toBe(1);
  });

  it("requires sign-in", async () => {
    auth.userId = null;
    expect((await post(schedule)).status).toBe(401);
    expect((await GET()).status).toBe(401);
  });

  it("rejects invalid or oversized schedules", async () => {
    const bad = (patch: object) => post({ ...schedule, ...patch });
    expect((await post("{not json")).status).toBe(400);
    expect((await bad({ courses: [{ ...schedule.courses[0], meetings: [{ days: ["Mon"], start: 900, end: 800 }] }] })).status).toBe(400);
    expect((await bad({ courses: [{ ...schedule.courses[0], meetings: [{ days: ["Mon"], start: 300, end: 400 }] }] })).status).toBe(400);
    expect((await bad({ addedFree: [{ day: "Mon", start: 600, end: 615 }] })).status).toBe(400); // under 30 minutes
    expect((await bad({ courses: [{ ...schedule.courses[0], startDate: "2026-13-01" }] })).status).toBe(400);
    expect((await post("x".repeat(300_001))).status).toBe(413);
    expect(await getDb().collection(COLLECTIONS.schedules).countDocuments()).toBe(0);
  });
});
