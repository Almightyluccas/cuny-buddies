// Classes and free time on real dates. Dates are "YYYY-MM-DD" in the
// student's calendar; math runs in UTC so time zones and DST can't shift a day.

import {
  DAY_END,
  DAY_START,
  DAYS,
  MIN_FREE_MINUTES,
  type Block,
  type Course,
  type Day,
  type Schedule,
} from "@/lib/schedule/model";

export interface ClassBlock {
  start: number;
  end: number;
  course: Course;
  location?: string;
}

const toUtc = (date: string) => new Date(`${date}T00:00:00Z`);

export function dayOf(date: string): Day {
  return DAYS[(toUtc(date).getUTCDay() + 6) % 7]; // getUTCDay: 0 = Sunday
}

export function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Monday of the week containing `date`.
export function weekStart(date: string): string {
  return addDays(date, -DAYS.indexOf(dayOf(date)));
}

export function weekDates(date: string): string[] {
  const monday = weekStart(date);
  return DAYS.map((_, i) => addDays(monday, i));
}

export function classesOn(schedule: Schedule, date: string): ClassBlock[] {
  const day = dayOf(date);
  return schedule.courses
    .filter((c) => c.startDate <= date && date <= c.endDate)
    .flatMap((course) =>
      course.meetings
        .filter((m) => m.days.includes(day))
        .map((m) => ({ start: m.start, end: m.end, course, location: m.location })),
    )
    .sort((a, b) => a.start - b.start);
}

// Gaps of at least MIN_FREE_MINUTES between the day's classes. Time before
// the first class and after the last doesn't count.
export function gapsBetween(classes: { start: number; end: number }[]): { start: number; end: number }[] {
  const merged: { start: number; end: number }[] = [];
  for (const c of [...classes].sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1);
    if (last && c.start <= last.end) last.end = Math.max(last.end, c.end);
    else merged.push({ start: c.start, end: c.end });
  }
  const gaps = [];
  for (let i = 1; i < merged.length; i++) {
    const start = merged[i - 1].end;
    const end = merged[i].start;
    if (end - start >= MIN_FREE_MINUTES) gaps.push({ start, end });
  }
  return gaps;
}

export interface FreeBlock {
  day: Day;
  start: number;
  end: number;
  added: boolean; // entered by the student rather than computed
}

const same = (a: { day: Day; start: number; end: number }, b: Block) =>
  a.day === b.day && a.start === b.start && a.end === b.end;

export function freeOn(schedule: Schedule, date: string): FreeBlock[] {
  const day = dayOf(date);
  const computed = gapsBetween(classesOn(schedule, date))
    .map((g) => ({ day, ...g, added: false }))
    .filter((b) => !schedule.removedFree.some((r) => same(b, r)));
  const added = schedule.addedFree
    .filter((b) => b.day === day)
    .map((b) => ({ day, start: b.start, end: b.end, added: true }));
  return [...computed, ...added].sort((a, b) => a.start - b.start);
}

// Hours to show: the earliest start to the latest end of any class or added
// block, within 7:00–22:00. A schedule with neither shows 9:00–17:00.
export function visibleHours(schedule: Schedule): { from: number; to: number } {
  const times = [
    ...schedule.courses.flatMap((c) => c.meetings),
    ...schedule.addedFree,
  ];
  if (!times.length) return { from: 9, to: 17 };
  const from = Math.floor(Math.min(...times.map((t) => t.start)) / 60);
  const to = Math.ceil(Math.max(...times.map((t) => t.end)) / 60);
  return { from: Math.max(from, DAY_START / 60), to: Math.min(to, DAY_END / 60) };
}

// The week to open on: this week if any class runs in it, otherwise the
// first week of the earliest class (e.g. importing before the term starts).
export function initialWeek(schedule: Schedule, today: string): string {
  const starts = schedule.courses.map((c) => c.startDate).sort();
  const ends = schedule.courses.map((c) => c.endDate).sort();
  if (!starts.length || (today >= starts[0] && today <= ends.at(-1)!)) return weekStart(today);
  return weekStart(today < starts[0] ? starts[0] : ends.at(-1)!);
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
