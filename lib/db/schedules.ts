import "server-only";

import { getDb } from "@/lib/db/client";
import { COLLECTIONS } from "@/lib/db/schema";
import type { Schedule } from "@/lib/schedule/model";

type ScheduleDoc = Schedule & { _id: string; createdAt: Date; updatedAt: Date };

function schedules() {
  return getDb().collection<ScheduleDoc>(COLLECTIONS.schedules);
}

export async function getSchedule(userId: string): Promise<Schedule | null> {
  const doc = await schedules().findOne(
    { _id: userId },
    { projection: { _id: 0, createdAt: 0, updatedAt: 0 } },
  );
  return doc;
}

// Replaces the user's schedule; validate with scheduleSchema first.
export async function saveSchedule(userId: string, schedule: Schedule): Promise<void> {
  const now = new Date();
  await schedules().updateOne(
    { _id: userId },
    { $set: { ...schedule, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
}
