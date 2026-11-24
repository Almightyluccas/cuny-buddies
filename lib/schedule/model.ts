// Schedule data shared by the browser parser, the calendar, and the API.
// Times are minutes after midnight; dates are "YYYY-MM-DD".

import { z } from "zod";
import { CAMPUS_IDS } from "@/lib/campuses";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

export const DAY_START = 7 * 60; // earliest CUNY class start
export const DAY_END = 22 * 60; // latest CUNY class end
export const MIN_FREE_MINUTES = 30; // shorter gaps are for getting between classes

const minutes = z.number().int().min(DAY_START).max(DAY_END);
const isoDate = z.iso.date();
const text = (max = 200) => z.string().trim().min(1).max(max);

export const meetingSchema = z
  .object({
    days: z.array(z.enum(DAYS)).min(1).max(7),
    start: minutes,
    end: minutes,
    location: text().optional(),
  })
  .refine((m) => m.start < m.end, "Meeting must start before it ends");

export const courseSchema = z
  .object({
    code: text(20).optional(), // "CHEM 10301"
    title: text().optional(),
    component: text(10).optional(), // "LEC"
    section: text(10).optional(), // "R4"
    status: text(20).optional(), // "Enrolled"
    classNumber: text(10).optional(), // "18506"
    college: text().optional(), // as printed, e.g. "City College"
    campusId: z.enum(CAMPUS_IDS).optional(),
    mode: text(40).optional(), // "In Person"
    instructors: z.array(text()).max(10).optional(),
    units: z.number().min(0).max(20).optional(),
    seats: text(20).optional(),
    waitlist: text(20).optional(),
    startDate: isoDate,
    endDate: isoDate,
    meetings: z.array(meetingSchema).max(20),
  })
  .refine((c) => c.startDate <= c.endDate, "Course must start before it ends");

// A weekly block the student added or removed by hand.
export const blockSchema = z
  .object({ day: z.enum(DAYS), start: minutes, end: minutes })
  .refine((b) => b.end - b.start >= MIN_FREE_MINUTES, `Free time is at least ${MIN_FREE_MINUTES} minutes`);

export const scheduleSchema = z.object({
  source: z.enum(["schedule-builder", "manual"]),
  courses: z.array(courseSchema).max(30),
  addedFree: z.array(blockSchema).max(100),
  removedFree: z.array(blockSchema).max(100),
  term: z
    .object({
      name: text(), // "2026 Fall Term"
      session: text().optional(), // "Regular Academic Session"
      code: text(20).optional(), // CUNYfirst term id, e.g. "3202630"
      startDate: isoDate,
      endDate: isoDate,
    })
    .optional(),
  printedBy: text().optional(),
  printedAt: text(40).optional(), // as printed, e.g. "11/21/26, 11:15 AM"
  device: z.object({ type: z.enum(["desktop", "mobile"]), userAgent: text(500) }).optional(),
  warnings: z.array(text(300)).max(100),
  text: z.string().max(200_000).optional(), // extracted PDF text, for re-parsing later
  parserVersion: z.number().int().positive().optional(),
});

export type Meeting = z.infer<typeof meetingSchema>;
export type Course = z.infer<typeof courseSchema>;
export type Block = z.infer<typeof blockSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;

export function emptySchedule(source: Schedule["source"] = "manual"): Schedule {
  return { source, courses: [], addedFree: [], removedFree: [], warnings: [] };
}
