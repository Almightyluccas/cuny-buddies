// Keeps the schedule in this browser, like the rest of onboarding, until
// sign-in lets it save to the account (POST /api/schedule).

import { scheduleSchema, type Schedule } from "@/lib/schedule/model";

const KEY = "cuny-buddies:schedule";

export function loadSchedule(): Schedule | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = scheduleSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveSchedule(schedule: Schedule): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(scheduleSchema.parse(schedule)));
    return true;
  } catch {
    return false;
  }
}
