"use client";

import {
  addDays,
  classesOn,
  dayOf,
  formatTime,
  freeOn,
  gapsBetween,
  localToday,
  visibleHours,
  weekDates,
  type ClassBlock,
  type FreeBlock,
} from "@/lib/schedule/free-time";
import type { Block, Schedule } from "@/lib/schedule/model";

const HOUR_PX = 48;
const MIN_PX = HOUR_PX / 60;

const dateLabel = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

const duration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ");
};

export default function WeekCalendar({
  schedule,
  week,
  onWeekChange,
  onToggleFree,
}: {
  schedule: Schedule;
  week: string; // any date in the week to show
  onWeekChange: (week: string) => void;
  // When set, free blocks are clickable: computed ones toggle removed,
  // added ones are deleted.
  onToggleFree?: (block: FreeBlock | (Block & { removed: true })) => void;
}) {
  const dates = weekDates(week);
  const { from, to } = visibleHours(schedule);
  const hours = Array.from({ length: to - from }, (_, i) => from + i);
  const today = localToday();
  const top = (minutes: number) => (minutes - from * 60) * MIN_PX;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold" aria-live="polite">
          {dateLabel(dates[0], { month: "short", day: "numeric" })} –{" "}
          {dateLabel(dates[6], { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <div className="flex gap-2">
          <NavButton onClick={() => onWeekChange(addDays(dates[0], -7))} label="Previous week">‹</NavButton>
          <NavButton onClick={() => onWeekChange(today)} label="This week">Today</NavButton>
          <NavButton onClick={() => onWeekChange(addDays(dates[0], 7))} label="Next week">›</NavButton>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <div className="grid min-w-[720px] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="sticky left-0 z-20 border-b border-border bg-surface" />
          {dates.map((date) => (
            <div
              key={date}
              className={`border-b border-l border-border px-1 py-2 text-center text-xs ${
                date === today ? "bg-brand-soft font-semibold text-brand-soft-fg" : "bg-surface"
              }`}
            >
              <div className="font-semibold">{dayOf(date)}</div>
              <div className="text-muted">{dateLabel(date, { month: "short", day: "numeric" })}</div>
            </div>
          ))}

          <div className="sticky left-0 z-20 bg-surface" style={{ height: hours.length * HOUR_PX }}>
            {hours.map((h) => (
              <div
                key={h}
                className={`absolute right-1 text-[10px] text-muted ${h > from ? "-translate-y-1/2" : ""}`}
                style={{ top: (h - from) * HOUR_PX }}
              >
                {formatTime(h * 60).replace(":00", "")}
              </div>
            ))}
          </div>

          {dates.map((date) => (
            <DayColumn
              key={date}
              classes={classesOn(schedule, date)}
              free={freeOn(schedule, date)}
              removed={removedOn(schedule, date)}
              hours={hours}
              top={top}
              onToggleFree={onToggleFree}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Computed blocks the student removed, shown so they can be restored.
function removedOn(schedule: Schedule, date: string): Block[] {
  const day = dayOf(date);
  return gapsBetween(classesOn(schedule, date))
    .map((g) => ({ day, ...g }))
    .filter((b) => schedule.removedFree.some((r) => r.day === b.day && r.start === b.start && r.end === b.end));
}

function DayColumn({
  classes,
  free,
  removed,
  hours,
  top,
  onToggleFree,
}: {
  classes: ClassBlock[];
  free: FreeBlock[];
  removed: Block[];
  hours: number[];
  top: (minutes: number) => number;
  onToggleFree?: (block: FreeBlock | (Block & { removed: true })) => void;
}) {
  const lanes = assignLanes(classes);
  return (
    <div className="relative border-l border-border" style={{ height: hours.length * HOUR_PX }}>
      {hours.map((h, i) => (
        <div key={h} aria-hidden>
          {i > 0 && <div className="absolute inset-x-0 h-px bg-border" style={{ top: i * HOUR_PX }} />}
          <div className="absolute inset-x-0 h-px bg-border/50" style={{ top: i * HOUR_PX + HOUR_PX / 2 }} />
        </div>
      ))}

      {removed.map((b) => (
        <button
          key={`removed-${b.start}`}
          type="button"
          disabled={!onToggleFree}
          onClick={() => onToggleFree?.({ ...b, removed: true })}
          className="absolute inset-x-1 rounded-md border border-dashed border-emerald-300 text-[10px] text-emerald-800/70 hover:bg-emerald-50"
          style={{ top: top(b.start), height: (b.end - b.start) * MIN_PX }}
          aria-label={`Restore free time ${formatTime(b.start)} to ${formatTime(b.end)}`}
        >
          Removed · tap to restore
        </button>
      ))}

      {free.map((b) => (
        <button
          key={`free-${b.start}-${b.added}`}
          type="button"
          disabled={!onToggleFree}
          onClick={() => onToggleFree?.(b)}
          className="absolute inset-x-1 overflow-hidden rounded-md border border-emerald-300 bg-emerald-50 px-1 text-left text-[10px] leading-tight text-emerald-900 enabled:hover:bg-emerald-100"
          style={{ top: top(b.start), height: (b.end - b.start) * MIN_PX }}
          aria-label={`Free ${formatTime(b.start)} to ${formatTime(b.end)}${onToggleFree ? ", tap to remove" : ""}`}
          title={`Free ${formatTime(b.start)}–${formatTime(b.end)}`}
        >
          <span className="font-semibold">Free</span> {duration(b.end - b.start)}
        </button>
      ))}

      {classes.map((c, i) => {
        const { lane, of } = lanes[i];
        return (
          <div
            key={`${c.course.code}-${c.start}-${i}`}
            className="absolute overflow-hidden rounded-md border-l-4 border-brand bg-brand-soft px-1 py-0.5 text-[10px] leading-tight text-brand-soft-fg"
            style={{
              top: top(c.start),
              height: (c.end - c.start) * MIN_PX,
              left: `calc(${(lane / of) * 100}% + 2px)`,
              width: `calc(${100 / of}% - 4px)`,
            }}
            title={[c.course.code, c.course.title, `${formatTime(c.start)}–${formatTime(c.end)}`, c.location]
              .filter(Boolean)
              .join("\n")}
          >
            <div className="font-semibold">{c.course.code ?? c.course.title ?? "Class"}</div>
            <div>
              {formatTime(c.start)}–{formatTime(c.end)}
            </div>
            {c.location && <div className="truncate text-brand-soft-fg/80">{c.location}</div>}
          </div>
        );
      })}
    </div>
  );
}

// Side-by-side lanes for overlapping classes.
function assignLanes(classes: ClassBlock[]) {
  const result = classes.map(() => ({ lane: 0, of: 1 }));
  let group: number[] = [];
  let groupEnd = -1;
  const close = () => {
    const laneEnds: number[] = [];
    for (const i of group) {
      const lane = laneEnds.findIndex((end) => end <= classes[i].start);
      const index = lane === -1 ? laneEnds.length : lane;
      laneEnds[index] = classes[i].end;
      result[i].lane = index;
    }
    for (const i of group) result[i].of = laneEnds.length;
    group = [];
  };
  classes.forEach((c, i) => {
    if (c.start >= groupEnd && group.length) close();
    group.push(i);
    groupEnd = Math.max(groupEnd, c.end);
  });
  if (group.length) close();
  return result;
}

function NavButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-bg"
    >
      {children}
    </button>
  );
}
