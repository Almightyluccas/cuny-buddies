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

// "invalid" means the schedule itself doesn't fit the model; "unavailable"
// means the browser refused to store it (private mode, full storage).
export function saveSchedule(schedule: Schedule): "saved" | "invalid" | "unavailable" {
  const parsed = scheduleSchema.safeParse(schedule);
  if (!parsed.success) return "invalid";
  try {
    localStorage.setItem(KEY, JSON.stringify(parsed.data));
    return "saved";
  } catch {
    return "unavailable";
  }
}
