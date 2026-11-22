// Parses the text of a CUNYfirst Schedule Builder print (desktop or mobile).
// Fields are found by content, never by position: prints differ in scale,
// orientation, headers, and where pages break. Meeting times are the core;
// every other field is kept when found and skipped when not.

import { CAMPUSES, type CampusId } from "@/lib/campuses";
import {
  DAY_END,
  DAY_START,
  type Course,
  type Day,
  type Meeting,
  type Schedule,
} from "@/lib/schedule/model";
import { addDays } from "@/lib/schedule/free-time";

export const PARSER_VERSION = 1;

const DAY = "(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)";
const TIME = "\\d{1,2}\\s?:\\s?\\d{2}\\s?[AP]\\s?M";
const MEETING_SRC = `(${DAY}(?:\\s*,\\s*${DAY})*)\\s*:\\s*(${TIME})\\s*to\\s*(${TIME})`;
const MEETING_ONE = new RegExp(MEETING_SRC, "i");
const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
const RANGE = `(${MONTH})\\s*(\\d{1,2})\\s*-\\s*(${MONTH})\\s*(\\d{1,2})`;
const TERM = new RegExp(`(\\d{4})\\s+(Fall|Spring|Summer|Winter)(?:\\s+Term)?\\s*:\\s*${RANGE}`, "i");
const DATE_RANGE = new RegExp(RANGE, "i");
const CODE = /^([A-Z]{2,5})\s?(\d{3,5}[A-Z]?)\b/;
const COMPONENT =
  /\b(LEC|LAB|REC|SEM|DIS|STU|IND|CLN|FLD|PRA|RSC|SUP|TUT|ACT|WKS|LCL|HYB|ONL)\s+([A-Z0-9]{1,6})\b(?:\s+([A-Z][a-z]+(?: [A-Z][a-z]+)?))?/;
const UNITS = /(\d+(?:\s?\.\s?\d+)?)\s?\/\s?(\d+(?:\.\d+)?)\s*Progress Units/i;
const MODE = /\b(Fully Online|Partially Online|Online|Hybrid|In Person)\b/i;
const SESSION = /\b([A-Z][\w-]*(?: [A-Z][\w-]*)* Session)\b/;
const ROOM = /^(.*?\bRm\b\s*\S+)/;
const NOISE =
  /^(https?:|Schedule Builder$|Course Attributes|PRE\b|Book Title|Author|Publisher|Publish|Edition|Year:|Price|Seats|Wait List|Printed by|USD$)/i;
const NAME = /^[A-Z][\p{L}'’.-]*(?: [A-Z][\p{L}'’.-]*)+(?:; [A-Z][\p{L}'’.-]*(?: [A-Z][\p{L}'’.-]*)+)*$/u;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Distinctive words in the college names Schedule Builder prints. Order
// matters: "New York City College of Technology" also contains "City College".
const COLLEGES: [CampusId, RegExp][] = [
  ["citytech", /City Tech|College of Technology/i],
  ["ccny", /City College/i],
  ["bmcc", /Borough of Manhattan|\bBMCC\b/i],
  ["bcc", /Bronx (?:CC|Community)/i],
  ["qcc", /Queensborough/i],
  ["kbcc", /Kingsborough/i],
  ["laguardia", /LaGuardia/i],
  ["hostos", /Hostos/i],
  ["guttman", /Guttman/i],
  ["baruch", /Baruch/i],
  ["brooklyn", /Brooklyn College/i],
  ["csi", /Staten Island/i],
  ["hunter", /Hunter/i],
  ["jjay", /John Jay/i],
  ["lehman", /Lehman/i],
  ["mec", /Medgar Evers/i],
  ["qc", /Queens College/i],
  ["york", /York College/i],
  ["macaulay", /Macaulay/i],
  ["journalism", /Journalism/i],
  ["sph", /Public Health/i],
  ["slu", /Labor and Urban|Labor & Urban/i],
  ["law", /School of Law|CUNY Law/i],
  ["sps", /Professional Studies/i],
  ["med", /School of Medicine/i],
  ["gc", /Graduate Center/i],
];
const COLLEGE_NAMES = new RegExp(
  // Full names first, so "The City College of New York" matches whole.
  [...CAMPUSES.map((c) => c.name), ...COLLEGES.map(([, re]) => re.source)].join("|"),
  "i",
);

export interface ParseResult {
  schedule: Schedule;
  // Courses with no meeting times found; shown to the student, not imported.
  skipped: string[];
}

interface Tile {
  code?: string;
  termLine?: string;
  lines: string[];
}

// Classes run this long from `today` when a print has no term dates.
const FALLBACK_WEEKS = 16;

// `today` is the student's local date ("YYYY-MM-DD"), used only when the
// print has no term dates. Every value is cut to the limits in model.ts, so
// odd prints can't produce a schedule the server rejects.
export function parseScheduleBuilder(lines: string[], today: string): ParseResult {
  const clean = lines.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const warnings: string[] = [];
  const joined = clean.join("\n");

  const term = parseTerm(joined);
  const printedBy = joined.match(/Printed by:\s*(.+?)(?=\s+\d{4}\s+(?:Fall|Spring|Summer|Winter)\b|\n|$)/i)?.[1];
  const printedAt = joined.match(/\b(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}\s?[AP]M)/i);
  const termCode = joined.match(/[?&]term=(\d{4,10})/)?.[1];
  const fallback = term ?? { startDate: today, endDate: addDays(today, FALLBACK_WEEKS * 7 - 1) };
  if (!term) {
    warnings.push(
      `Term dates weren't found, so classes are shown for ${FALLBACK_WEEKS} weeks from today. Import a full Schedule Builder print to get the real dates.`,
    );
  }

  const courses: Course[] = [];
  const skipped: string[] = [];
  for (const tile of splitTiles(clean)) {
    const { course, trimmed } = parseTile(tile, term, fallback);
    if (course.meetings.length) courses.push(course);
    else skipped.push(course.code ?? course.title ?? "A course");
    if (trimmed && course.meetings.length) {
      warnings.push(`${course.code ?? course.title ?? "A class"}: times outside 7 AM–10 PM were trimmed to that range.`);
    }
  }
  if (!courses.length) warnings.push("No class times found in this file.");
  for (const name of skipped) warnings.push(`${name}: no meeting times found (online, TBA, or unreadable).`);

  return {
    schedule: {
      source: "schedule-builder",
      courses: courses.slice(0, 30),
      addedFree: [],
      removedFree: [],
      term: term && {
        name: term.name,
        session: cap(term.session, 200),
        code: cap(termCode, 20),
        startDate: term.startDate,
        endDate: term.endDate,
      },
      printedBy: cap(printedBy, 200),
      printedAt: printedAt ? cap(`${printedAt[1]}, ${printedAt[2]}`, 40) : undefined,
      warnings: warnings.slice(0, 100).map((w) => w.slice(0, 300)),
      text: clean.join("\n").slice(0, 200_000),
      parserVersion: PARSER_VERSION,
    },
    skipped,
  };
}

// Trims to `max` characters; empty becomes undefined.
function cap(value: string | undefined, max: number): string | undefined {
  const v = value?.trim().slice(0, max).trim();
  return v || undefined;
}

// Each course tile has one term line, with its course code on the same line
// or within 2 lines (prints order them either way). Codes in the weekly grid
// have no term line next to them, so they're ignored. Prints without term
// lines fall back to codes followed by a meeting time.
function splitTiles(all: string[]): Tile[] {
  const lines = all.filter((l) => !isPageChrome(l));
  const codeAt = (i: number) => lines[i]?.match(CODE);
  const starts = new Map<number, Tile>();

  const termRows = lines.flatMap((l, i) => (TERM.test(l) ? [i] : []));
  for (const t of termRows) {
    const near = [0, 1, -1, 2, -2].map((d) => t + d).find((i) => codeAt(i));
    const code = near === undefined ? undefined : codeAt(near)!;
    const start = Math.min(t, near ?? t);
    starts.set(start, { code: code ? `${code[1]} ${code[2]}` : undefined, termLine: lines[t], lines: [] });
  }
  if (!termRows.length) {
    lines.forEach((l, i) => {
      const code = codeAt(i);
      if (code && lines.slice(i, i + 5).some((x) => MEETING_ONE.test(x))) {
        starts.set(i, { code: `${code[1]} ${code[2]}`, lines: [] });
      }
    });
  }

  const order = [...starts.keys()].sort((a, b) => a - b);
  return order.map((start, k) => {
    const tile = starts.get(start)!;
    tile.lines = lines.slice(start, order[k + 1] ?? lines.length);
    return tile;
  });
}

function isPageChrome(line: string) {
  return (
    /^https?:\/\//.test(line) ||
    /^\d{1,2}\/\d{1,2}\/\d{2,4},? \d{1,2}:\d{2}\s?[AP]M(?: Schedule Builder)?$/i.test(line)
  );
}

function parseTile(
  tile: Tile,
  term: ReturnType<typeof parseTerm>,
  fallback: DateRange,
): { course: Course; trimmed: boolean } {
  const meetings = new Map<string, Meeting>();
  const course: Partial<Course> = { code: tile.code };
  let sawLocation = false;
  let trimmed = false;

  for (const line of tile.lines) {
    for (const m of line.matchAll(new RegExp(MEETING_SRC, "gi"))) {
      const parsed = toMeeting(m[1], m[2], m[3]);
      if (!parsed) continue;
      const { meeting } = parsed;
      if (parsed.trimmed) trimmed = true;
      const key = `${meeting.days.join(",")}-${meeting.start}-${meeting.end}`;
      const after = line.slice((m.index ?? 0) + m[0].length).trim();
      const location =
        after.match(ROOM)?.[1] ?? (after && after.length <= 60 && !after.includes(":") ? after : undefined);
      const existing = meetings.get(key);
      if (!existing) meetings.set(key, { ...meeting, ...(location && { location }) });
      else if (location && !existing.location) existing.location = location;
      if (location) sawLocation = true;
    }

    const component = line.match(COMPONENT);
    if (component && !course.component) {
      course.component = component[1];
      course.section = component[2];
      const status = component[3]?.replace(/(\w+)\1$/, "$1"); // bold text prints twice
      if (status && /^(Enrolled|Waitlisted|Wait Listed|Dropped|Planned|Selected)$/i.test(status)) course.status = status;
    }
    const classNumber = line.match(/^(\d{4,6})$/)?.[1];
    if (classNumber && !course.classNumber) course.classNumber = classNumber;
    const units = line.match(UNITS);
    if (units && course.units === undefined) course.units = Number(units[2]);
    const seats = line.match(/Seats:\s*([\w/ ]+?)(?=\s+Wait List|$)/i)?.[1];
    if (seats && !course.seats) course.seats = cap(seats, 20);
    const waitlist = line.match(/Wait List:\s*([\w/ ]+)/i)?.[1];
    if (waitlist && !course.waitlist) course.waitlist = cap(waitlist, 20);

    // College and mode count only on a line holding nothing else, so a title
    // like "Introduction to Journalism" or "Online Marketing" isn't mistaken.
    const collegeName = line.match(COLLEGE_NAMES)?.[0];
    const mode = line.match(MODE)?.[1];
    const onlyCollegeOrMode =
      (collegeName || mode) && !line.replace(collegeName ?? "", "").replace(mode ?? "", "").trim();
    if (onlyCollegeOrMode && mode && !course.mode) course.mode = titleCase(mode);
    if (onlyCollegeOrMode && collegeName && !course.college) {
      course.college = cap(collegeName, 200);
      course.campusId = COLLEGES.find(([, re]) => re.test(collegeName))?.[0];
    }

    if (!MEETING_ONE.test(line) && ROOM.test(line) && !line.includes(":")) {
      // One location for the whole course, printed on its own line.
      const location = line.match(ROOM)![1];
      for (const m of meetings.values()) m.location ??= location;
      sawLocation = true;
    } else if (sawLocation && !course.instructors && isNameLine(line)) {
      course.instructors = line
        .split(";")
        .map((n) => cap(n, 200))
        .filter((n): n is string => !!n)
        .slice(0, 10);
    }
  }

  const range = courseDates(tile, term, fallback);
  return { trimmed, course: {
    code: cap(course.code, 20),
    title: cap(findTitle(tile), 200),
    component: cap(course.component, 10),
    section: cap(course.section, 10),
    status: cap(course.status, 20),
    classNumber: cap(course.classNumber, 10),
    college: course.college,
    campusId: course.campusId,
    mode: cap(course.mode, 40),
    instructors: course.instructors?.length ? course.instructors : undefined,
    units: course.units !== undefined && course.units <= 20 ? course.units : undefined,
    seats: course.seats,
    waitlist: course.waitlist,
    startDate: range.startDate,
    endDate: range.endDate,
    meetings: [...meetings.values()].slice(0, 20).map((m) => ({ ...m, location: cap(m.location, 200) })),
  } };
}

function isNameLine(line: string) {
  return (
    NAME.test(line) &&
    !NOISE.test(line) &&
    !MODE.test(line) &&
    !SESSION.test(line) &&
    !COLLEGE_NAMES.test(line) &&
    !/students only/i.test(line)
  );
}

// The first plain line after the code and term, or the text before a
// meeting time when a print puts both on one line.
function findTitle(tile: Tile): string | undefined {
  for (const line of tile.lines) {
    if (line === tile.termLine && !tile.code) continue;
    let rest = line;
    if (tile.code) rest = rest.replace(new RegExp(`^${tile.code.replace(" ", "\\s?")}\\b`), "");
    rest = rest.replace(TERM, "").replace(SESSION, "").trim();
    const meeting = rest.search(MEETING_ONE);
    if (meeting === 0) return undefined;
    if (meeting > 0) rest = rest.slice(0, meeting).trim();
    if (rest && !NOISE.test(rest) && !COMPONENT.test(rest) && !/^\d+$/.test(rest)) return rest.slice(0, 200);
  }
  return undefined;
}

type DateRange = { startDate: string; endDate: string };

function parseTerm(text: string) {
  const m = text.match(TERM);
  if (!m) return undefined;
  const range = dateRange(Number(m[1]), m[3], m[4], m[5], m[6]);
  if (!range) return undefined;
  const session = text.slice(m.index).match(SESSION)?.[1];
  return { name: `${m[1]} ${titleCase(m[2])} Term`, session, ...range };
}

// A date range inside the tile but outside the term line is the class's own
// (e.g. a shorter session); otherwise the class runs the whole term.
function courseDates(tile: Tile, term: ReturnType<typeof parseTerm>, fallback: DateRange): DateRange {
  // A print can list courses from different terms; each tile has its own.
  const own = tile.termLine ? parseTerm(tile.termLine) : undefined;
  if (own) {
    term = own;
    fallback = { startDate: own.startDate, endDate: own.endDate };
  }
  const year = Number(fallback.startDate.slice(0, 4));
  for (const line of tile.lines) {
    if (TERM.test(line)) continue;
    const m = line.match(DATE_RANGE);
    if (!m) continue;
    let range = dateRange(year, m[1], m[2], m[3], m[4]);
    // In a term that crosses New Year, January dates belong to the next year.
    if (range && term && range.startDate < term.startDate) range = dateRange(year + 1, m[1], m[2], m[3], m[4]);
    if (range) return range;
  }
  return fallback;
}

// "Aug 28" to "Dec 21" in `year`; the end rolls into the next year when it's
// earlier than the start. Null for impossible dates such as "Sep 31".
function dateRange(year: number, m1: string, d1: string, m2: string, d2: string): DateRange | null {
  const startDate = isoDate(year, m1, d1);
  let endDate = isoDate(year, m2, d2);
  if (startDate && endDate && endDate < startDate) endDate = isoDate(year + 1, m2, d2);
  return startDate && endDate ? { startDate, endDate } : null;
}

// Times past 7:00–22:00 are trimmed to that range (and flagged) rather than
// dropped, so a late class still blocks its time. Null when nothing is left.
function toMeeting(days: string, start: string, end: string): { meeting: Meeting; trimmed: boolean } | null {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null || s >= e) return null;
  const clampedStart = Math.max(s, DAY_START);
  const clampedEnd = Math.min(e, DAY_END);
  if (clampedStart >= clampedEnd) return null;
  const list = days.split(",").map((d) => titleCase(d.trim()).slice(0, 3) as Day);
  return {
    meeting: { days: [...new Set(list)], start: clampedStart, end: clampedEnd },
    trimmed: clampedStart !== s || clampedEnd !== e,
  };
}

export function toMinutes(time: string): number | null {
  const m = time.replace(/\s/g, "").match(/^(\d{1,2}):(\d{2})([AP])M$/i);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  const pm = m[3].toUpperCase() === "P";
  return ((hour % 12) + (pm ? 12 : 0)) * 60 + minute;
}

function isoDate(year: number, month: string, day: string): string | null {
  const index = MONTHS.findIndex((m) => m.toLowerCase() === month.slice(0, 3).toLowerCase());
  const date = `${year}-${String(index + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${date}T00:00:00Z`); // Invalid Date for e.g. day 0 or 99
  if (index < 0 || Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === date ? date : null; // rejects Sep 31
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
