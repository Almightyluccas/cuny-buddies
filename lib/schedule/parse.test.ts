import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scheduleSchema } from "@/lib/schedule/model";
import { scheduleWarnings } from "@/lib/schedule/free-time";
import { parseScheduleBuilder, toMinutes } from "@/lib/schedule/parse";

const TODAY = "2026-11-22";

// Lines extracted from real Schedule Builder prints (scripts/schedule-fixture.mts),
// with personal names replaced.
const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", `${name}.txt`), "utf8").split(/\r?\n/);

const expected = [
  {
    code: "CHEM 10301",
    title: "General Chemistry I",
    component: "LEC",
    section: "R4",
    classNumber: "18506",
    units: 4,
    instructors: ["Avery Lin", "Blake Moss", "Casey Ruiz"],
    meetings: [
      { days: ["Mon"], start: 960, end: 1070, location: "Marshak Science Building Rm 1001" },
      { days: ["Tue", "Thu"], start: 930, end: 1005, location: "Marshak Science Building Rm MR2" },
      { days: ["Wed"], start: 840, end: 950, location: "Marshak Science Building Rm 408" },
    ],
  },
  {
    code: "CSC 30400",
    title: "Introduction to Theoretical Computer Science",
    section: "D2",
    classNumber: "19240",
    units: 3,
    instructors: ["Devon Park"],
    meetings: [{ days: ["Mon", "Wed"], start: 750, end: 825, location: "Shepard Hall Rm S-376" }],
  },
  {
    code: "CSC 32200",
    title: "Software Engineering",
    instructors: ["Emery Cole"],
    meetings: [{ days: ["Tue", "Thu"], start: 840, end: 915, location: "Steinman Hall Rm 161" }],
  },
  {
    code: "CSC 33600",
    title: "Introduction to Database Systems",
    instructors: ["Finley Shaw"],
    meetings: [{ days: ["Tue", "Thu"], start: 1020, end: 1095, location: "North Academic Center Rm 5/126" }],
  },
  {
    code: "CSC 45600",
    title: "Topics in Software Engineering",
    section: "1HJ",
    seats: "29/30",
    instructors: ["Gray Holt"],
    meetings: [{ days: ["Mon"], start: 1110, end: 1260, location: "North Academic Center Rm 4/121B" }],
  },
];

describe.each(["desktop-portrait", "desktop-landscape", "mobile"])("Schedule Builder print: %s", (name) => {
  const { schedule, skipped } = parseScheduleBuilder(fixture(name), TODAY);

  it("finds every course with its meetings, locations, and details", () => {
    expect(skipped).toEqual([]);
    expect(schedule.courses).toHaveLength(5);
    expected.forEach((course, i) => expect(schedule.courses[i]).toMatchObject(course));
    for (const c of schedule.courses) {
      expect(c).toMatchObject({
        status: "Enrolled",
        college: "City College",
        campusId: "ccny",
        mode: "In Person",
        startDate: "2026-08-28",
        endDate: "2026-12-21",
      });
    }
  });

  it("reads the term and who printed it", () => {
    expect(schedule.term).toMatchObject({
      name: "2026 Fall Term",
      session: "Regular Academic Session",
      startDate: "2026-08-28",
      endDate: "2026-12-21",
    });
    expect(schedule.printedBy).toBe("Student Name");
    expect(schedule.warnings).toEqual([]);
  });

  it("produces a schedule the server accepts", () => {
    expect(scheduleSchema.safeParse(schedule).success).toBe(true);
  });
});

describe("partial or unusual prints", () => {
  it("keeps a class whose code is unreadable, using its times", () => {
    const { schedule } = parseScheduleBuilder([
      "C S C 3 3 6 0 0 2027 Spring Term: Jan 27 - May 26",
      "Tue, Thu : 5:00 PM to 6:15 PM",
    ], TODAY);
    expect(schedule.courses).toHaveLength(1);
    expect(schedule.courses[0]).toMatchObject({
      code: undefined,
      startDate: "2027-01-27",
      endDate: "2027-05-26",
      meetings: [{ days: ["Tue", "Thu"], start: 1020, end: 1095 }],
    });
    expect(scheduleWarnings(schedule)).toEqual([
      "A class on Tue, Thu at 5:00 PM–6:15 PM has no readable course code.",
    ]);
    // The warning goes away with the class.
    expect(scheduleWarnings({ ...schedule, courses: [] })).toEqual([]);
  });

  it("reports a course with no meeting times instead of importing it", () => {
    const { schedule, skipped } = parseScheduleBuilder([
      "HIST 10100 2026 Fall Term: Aug 28 - Dec 21",
      "World History Online asynchronous",
      "MATH 20100 2026 Fall Term: Aug 28 - Dec 21",
      "Mon, Wed : 9:00 AM to 10:15 AM",
    ], TODAY);
    expect(skipped).toEqual(["HIST 10100"]);
    expect(schedule.courses.map((c) => c.code)).toEqual(["MATH 20100"]);
  });

  it("uses a class's own dates when they differ from the term", () => {
    const { schedule } = parseScheduleBuilder([
      "BIO 10100 2026 Fall Term: Aug 28 - Dec 21",
      "Seven Week Session",
      "Fri : 10:00 AM to 12:00 PM",
      "Aug 28 - Oct 16",
    ], TODAY);
    expect(schedule.courses[0]).toMatchObject({ startDate: "2026-08-28", endDate: "2026-10-16" });
  });

  it("rolls the year over for terms that cross New Year", () => {
    const { schedule } = parseScheduleBuilder([
      "ENG 21000 2026 Winter Term: Dec 28 - Jan 22",
      "Mon : 10:00 AM to 1:00 PM",
    ], TODAY);
    expect(schedule.term).toMatchObject({ startDate: "2026-12-28", endDate: "2027-01-22" });
  });

  it("trims times past 7:00–22:00 with a warning and drops impossible ones", () => {
    const { schedule } = parseScheduleBuilder([
      "PHYS 20700 2026 Fall Term: Aug 28 - Dec 21",
      "Mon : 6:00 AM to 7:30 AM",
      "Tue : 3:00 PM to 2:00 PM",
      "Wed : 9:30 PM to 10:00 PM",
      "Thu : 7:00 PM to 10:10 PM",
      "Fri : 5:00 AM to 6:30 AM",
    ], TODAY);
    expect(schedule.courses[0].meetings).toEqual([
      { days: ["Mon"], start: 420, end: 450 },
      { days: ["Wed"], start: 1290, end: 1320 },
      { days: ["Thu"], start: 1140, end: 1320 },
    ]);
    expect(schedule.warnings).toEqual(["PHYS 20700: times outside 7 AM–10 PM were trimmed to that range."]);
  });

  it("dates each course by its own term line", () => {
    const { schedule } = parseScheduleBuilder([
      "CSC 10300 2026 Fall Term: Aug 28 - Dec 21",
      "Mon : 9:00 AM to 10:15 AM",
      "ENG 21000 2027 Winter Term: Jan 2 - Jan 25",
      "Tue : 9:00 AM to 12:00 PM",
    ], TODAY);
    expect(schedule.courses.map((c) => [c.startDate, c.endDate])).toEqual([
      ["2026-08-28", "2026-12-21"],
      ["2027-01-02", "2027-01-25"],
    ]);
  });

  it("skips day 0 or 99 instead of failing the import", () => {
    const { schedule } = parseScheduleBuilder([
      "BIO 10100 2026 Fall Term: Aug 28 - Dec 21",
      "Fri : 10:00 AM to 12:00 PM",
      "Sep 0 - Oct 16",
      "Aug 99 - Dec 21",
    ], TODAY);
    expect(schedule.courses[0]).toMatchObject({ startDate: "2026-08-28", endDate: "2026-12-21" });
  });

  it("finds nothing in an unrelated document", () => {
    const { schedule } = parseScheduleBuilder(["Invoice #123", "Total due: $40"], TODAY);
    expect(schedule.courses).toEqual([]);
    expect(schedule.warnings).toContain("No class times found in this file.");
  });
});

describe("toMinutes", () => {
  it("handles noon, midnight, and spacing from PDF text", () => {
    expect(toMinutes("12:30 PM")).toBe(750);
    expect(toMinutes("12:00 AM")).toBe(0);
    expect(toMinutes("9 : 05 A M")).toBe(545);
    expect(toMinutes("13:00 PM")).toBeNull();
  });
});

describe("review fixes", () => {
  it("takes college and mode only from lines that hold nothing else", () => {
    const { schedule } = parseScheduleBuilder(
      [
        "JOUR 10100 2026 Fall Term: Aug 28 - Dec 21",
        "Introduction to Journalism",
        "Mon : 9:00 AM to 10:15 AM",
        "City College",
        "In Person",
        "MKT 20000 2026 Fall Term: Aug 28 - Dec 21",
        "Online Marketing",
        "Tue : 9:00 AM to 10:15 AM",
        "The City College of New York",
        "Hybrid",
      ],
      TODAY,
    );
    expect(schedule.courses[0]).toMatchObject({ title: "Introduction to Journalism", campusId: "ccny", college: "City College", mode: "In Person" });
    expect(schedule.courses[1]).toMatchObject({ title: "Online Marketing", campusId: "ccny", college: "The City College of New York", mode: "Hybrid" });
  });

  it("shows classes for 16 weeks from today when the print has no term dates", () => {
    const { schedule } = parseScheduleBuilder(["CSC 10300", "Mon : 9:00 AM to 10:15 AM"], TODAY);
    expect(schedule.courses[0]).toMatchObject({ startDate: "2026-11-22", endDate: "2027-03-13" });
    expect(schedule.warnings[0]).toMatch(/16 weeks from today/);
    expect(scheduleSchema.safeParse(schedule).success).toBe(true);
  });

  it("dates January classes in a term that crosses New Year to the next year", () => {
    const { schedule } = parseScheduleBuilder(
      ["ENG 21000 2026 Winter Term: Dec 28 - Jan 22", "Mon : 10:00 AM to 1:00 PM", "Jan 4 - Jan 22"],
      TODAY,
    );
    expect(schedule.courses[0]).toMatchObject({ startDate: "2027-01-04", endDate: "2027-01-22" });
  });

  it("ignores impossible dates instead of storing them", () => {
    const { schedule } = parseScheduleBuilder(
      ["BIO 10100 2026 Fall Term: Aug 28 - Dec 21", "Fri : 10:00 AM to 12:00 PM", "Sep 31 - Oct 16"],
      TODAY,
    );
    expect(schedule.courses[0]).toMatchObject({ startDate: "2026-08-28", endDate: "2026-12-21" });
  });

  it("cuts oversized values to what the server accepts", () => {
    const names = Array.from({ length: 12 }, (_, i) => `Person Number${String.fromCharCode(65 + i)}`).join("; ");
    const { schedule } = parseScheduleBuilder(
      [
        "CSC 10300 2026 Fall Term: Aug 28 - Dec 21",
        "Mon : 9:00 AM to 10:15 AM Shepard Hall Rm 101",
        `Wait List: ${"9".repeat(40)}`,
        names,
      ],
      TODAY,
    );
    expect(schedule.courses[0].instructors).toHaveLength(10);
    expect(schedule.courses[0].waitlist).toHaveLength(20);
    expect(scheduleSchema.safeParse(schedule).success).toBe(true);
  });
});
