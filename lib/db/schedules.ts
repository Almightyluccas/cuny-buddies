import "server-only";

import { getDb } from "@/lib/db/client";
import { COLLECTIONS } from "@/lib/db/schema";
import type { Schedule } from "@/lib/schedule/model";

type ScheduleDoc = Schedule & { _id: string; createdAt: Date; updatedAt: Date };

function schedules() {
  return getDb().collection<ScheduleDoc>(COLLECTIONS.schedules);
}

export async function getSchedule(userId: string): Promise<Schedule | null> {
  return schedules().findOne({ _id: userId }, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } });
}

// Replaces the user's schedule entirely, so fields the new one doesn't have
// (e.g. term after switching to manual entry) don't linger. Validate first.
export async function saveSchedule(userId: string, schedule: Schedule): Promise<void> {
  const now = new Date();
  const existing = await schedules().findOne({ _id: userId }, { projection: { createdAt: 1 } });
  const clean = JSON.parse(JSON.stringify(schedule)) as Schedule; // drop undefined keys
  await schedules().replaceOne(
    { _id: userId },
    { ...clean, createdAt: existing?.createdAt ?? now, updatedAt: now },
    { upsert: true },
  );
}
