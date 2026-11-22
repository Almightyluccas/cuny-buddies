import { describe, expect, it } from "vitest";
import {
  classesOn,
  dayOf,
  formatTime,
  freeOn,
  gapsBetween,
  initialWeek,
  visibleHours,
  weekDates,
} from "@/lib/schedule/free-time";
import { emptySchedule, type Course, type Schedule } from "@/lib/schedule/model";

const course = (code: string, meetings: Course["meetings"], startDate = "2026-08-28", endDate = "2026-12-21"): Course => ({
  code,
  startDate,
  endDate,
  meetings,
});

const schedule = (courses: Course[], extra: Partial<Schedule> = {}): Schedule => ({
  ...emptySchedule("schedule-builder"),
  courses,
  ...extra,
});

describe("gapsBetween", () => {
  it("keeps gaps of 30 minutes or more between classes only", () => {
    expect(
      gapsBetween([
        { start: 600, end: 675 }, // 10:00–11:15
        { start: 705, end: 780 }, // 11:45–13:00, 30 min gap
        { start: 809, end: 900 }, // 13:29–15:00, 29 min gap
      ]),
    ).toEqual([{ start: 675, end: 705 }]);
  });

  it("merges back-to-back and overlapping classes", () => {
    expect(
      gapsBetween([
        { start: 600, end: 700 },
        { start: 700, end: 760 },
        { start: 740, end: 800 },
        { start: 900, end: 960 },
      ]),
    ).toEqual([{ start: 800, end: 900 }]);
  });

  it("finds nothing with one class or none", () => {
    expect(gapsBetween([{ start: 600, end: 700 }])).toEqual([]);
    expect(gapsBetween([])).toEqual([]);
  });
});

describe("dates", () => {
  it("maps dates to weekdays and Monday-first weeks", () => {
    expect(dayOf("2026-08-31")).toBe("Mon");
    expect(dayOf("2026-09-06")).toBe("Sun");
    expect(weekDates("2026-09-03")).toEqual([
      "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06",
    ]);
    expect(weekDates("2026-11-01")[0]).toBe("2026-10-26"); // DST change week
  });

  it("shows a class only between its start and end dates", () => {
    const s = schedule([course("BIO 10100", [{ days: ["Fri"], start: 600, end: 720 }], "2026-08-28", "2026-10-16")]);
    expect(classesOn(s, "2026-10-16")).toHaveLength(1);
    expect(classesOn(s, "2026-10-23")).toHaveLength(0);
    expect(classesOn(s, "2026-08-21")).toHaveLength(0);
  });
});

describe("freeOn", () => {
  const s = schedule([
    course("CSC 30400", [{ days: ["Mon", "Wed"], start: 750, end: 825 }]),
    course("CHEM 10301", [{ days: ["Mon"], start: 960, end: 1070 }]),
    course("CSC 45600", [{ days: ["Mon"], start: 1110, end: 1260 }], "2026-08-28", "2026-10-16"),
  ]);

  it("computes gaps from the classes running that date", () => {
    expect(freeOn(s, "2026-08-31")).toEqual([
      { day: "Mon", start: 825, end: 960, added: false },
      { day: "Mon", start: 1070, end: 1110, added: false },
    ]);
    // After CSC 45600 ends, only the first gap is left.
    expect(freeOn(s, "2026-10-19")).toEqual([{ day: "Mon", start: 825, end: 960, added: false }]);
  });

  it("applies the student's removed and added blocks", () => {
    const edited = {
      ...s,
      removedFree: [{ day: "Mon" as const, start: 825, end: 960 }],
      addedFree: [{ day: "Mon" as const, start: 540, end: 600 }],
    };
    expect(freeOn(edited, "2026-08-31")).toEqual([
      { day: "Mon", start: 540, end: 600, added: true },
      { day: "Mon", start: 1070, end: 1110, added: false },
    ]);
  });
});

describe("calendar range", () => {
  it("spans the earliest and latest times, within 7:00–22:00", () => {
    const s = schedule([
      course("A", [{ days: ["Mon"], start: 750, end: 825 }]),
      course("B", [{ days: ["Tue"], start: 1110, end: 1260 }]),
    ]);
    expect(visibleHours(s)).toEqual({ from: 12, to: 21 });
    expect(visibleHours(schedule([course("C", [{ days: ["Mon"], start: 420, end: 1320 }])]))).toEqual({ from: 7, to: 22 });
    expect(visibleHours(emptySchedule())).toEqual({ from: 9, to: 17 });
  });

  it("opens on this week during the term, else the nearest term week", () => {
    const s = schedule([course("A", [{ days: ["Mon"], start: 600, end: 700 }])]);
    expect(initialWeek(s, "2026-09-09")).toBe("2026-09-07");
    expect(initialWeek(s, "2026-08-10")).toBe("2026-08-24");
    expect(initialWeek(s, "2027-01-15")).toBe("2026-12-21");
    expect(initialWeek(emptySchedule(), "2026-09-09")).toBe("2026-09-07");
  });

  it("formats times", () => {
    expect(formatTime(750)).toBe("12:30 PM");
    expect(formatTime(420)).toBe("7:00 AM");
    expect(formatTime(1320)).toBe("10:00 PM");
  });
});
