"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";
import WeekCalendar from "@/components/schedule/WeekCalendar";
import { detectDevice, type DeviceType } from "@/lib/schedule/device";
import { formatTime, initialWeek, localToday, type FreeBlock } from "@/lib/schedule/free-time";
import { DAY_END, DAY_START, DAYS, MIN_FREE_MINUTES, emptySchedule, type Block, type Day, type Schedule } from "@/lib/schedule/model";
import { parseScheduleBuilder } from "@/lib/schedule/parse";
import { ScheduleFileError, readPdfLines } from "@/lib/schedule/pdf";
import { loadSchedule, saveSchedule } from "@/lib/schedule/storage";

const SCHEDULE_BUILDER = "https://sb.cunyfirst.cuny.edu/criteria";
const TIMES = Array.from({ length: (DAY_END - DAY_START) / 15 + 1 }, (_, i) => DAY_START + i * 15);

type Step = "choose" | "review";

export default function ScheduleSetup({ onSaved }: { onSaved?: () => void }) {
  const [schedule, setSchedule] = useState<Schedule>(() => emptySchedule());
  const [step, setStep] = useState<Step>("choose");
  const [week, setWeek] = useState(""); // set after mount: dates can't be prerendered
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Browser-only state (storage, user agent) loads after mount to match SSR.
  useEffect(() => {
    const stored = loadSchedule();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from the browser
    setDevice(detectDevice(navigator).type);
    setWeek(stored ? initialWeek(stored, localToday()) : localToday());
    if (stored) {
      setSchedule(stored);
      setStep("review");
    }
  }, []);

  function update(next: Schedule) {
    setSchedule(next);
    setSaved(false);
  }

  async function handleFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const { schedule: parsed } = parseScheduleBuilder(await readPdfLines(file));
      if (!parsed.courses.length) {
        setError("We couldn't find any class times in that file. Check it's your Schedule Builder print, or add your free time manually.");
        return;
      }
      const next = { ...parsed, device: detectDevice(navigator) };
      update(next);
      setWeek(initialWeek(next, localToday()));
      setStep("review");
    } catch (e) {
      setError(e instanceof ScheduleFileError ? e.message : "We couldn't read that PDF. Try printing it again, or add your free time manually.");
    } finally {
      setBusy(false);
    }
  }

  function toggleFree(block: FreeBlock | (Block & { removed: true })) {
    const key = (b: Block) => `${b.day}-${b.start}-${b.end}`;
    const target = { day: block.day, start: block.start, end: block.end };
    if ("removed" in block) {
      update({ ...schedule, removedFree: schedule.removedFree.filter((b) => key(b) !== key(target)) });
    } else if (block.added) {
      update({ ...schedule, addedFree: schedule.addedFree.filter((b) => key(b) !== key(target)) });
    } else {
      update({ ...schedule, removedFree: [...schedule.removedFree, target] });
    }
  }

  function handleSave() {
    if (!saveSchedule(schedule)) {
      setError("We couldn't save your schedule in this browser. Check storage settings and try again.");
      return;
    }
    setSaved(true);
    onSaved?.();
  }

  if (step === "choose") {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border-2 border-brand bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Recommended</p>
          <h3 className="mt-1 text-lg font-bold">Import from Schedule Builder</h3>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>
              Open{" "}
              <a href={SCHEDULE_BUILDER} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">
                Schedule Builder
              </a>{" "}
              (CUNYfirst sign-in) and pick the current term.
            </li>
            {device === "mobile" ? (
              <li>Tap <b>Generate schedules</b>, open your schedule, then tap <b>Print</b>.</li>
            ) : (
              <li>Scroll to the bottom of your schedule and click <b>Print</b>.</li>
            )}
            <li>Choose <b>Save as PDF</b>, then upload it here. It&apos;s read on your device and never uploaded.</li>
          </ol>
          <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover has-[:disabled]:cursor-wait has-[:disabled]:opacity-60">
            {busy ? "Reading your schedule…" : "Upload schedule PDF"}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleFile(file);
              }}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-lg font-bold">Add free time manually</h3>
          <p className="mt-1 text-sm text-muted">
            Skip the import and enter the weekly times you&apos;re free (at least {MIN_FREE_MINUTES} minutes each).
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              update(emptySchedule("manual"));
              setStep("review");
            }}
          >
            Enter free time
          </Button>
        </section>

        {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {schedule.warnings.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Check these before saving:</p>
          <ul className="mt-1 list-disc pl-5">
            {schedule.warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}

      <p className="text-sm text-muted">
        {schedule.courses.length
          ? `Free time is any gap of ${MIN_FREE_MINUTES}+ minutes between your classes. Tap a free block to remove it, and add any other times you're free.`
          : "Add the weekly times you're free. Tap a block to remove it."}
      </p>

      {week && <WeekCalendar schedule={schedule} week={week} onWeekChange={setWeek} onToggleFree={toggleFree} />}

      <AddFreeTime onAdd={(b) => update({ ...schedule, addedFree: [...schedule.addedFree, b] })} />

      {schedule.courses.length > 0 && (
        <section>
          <h3 className="mb-2 font-bold">Classes ({schedule.courses.length})</h3>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {schedule.courses.map((c, i) => (
              <li key={`${c.code}-${i}`} className="flex items-start justify-between gap-3 p-3 text-sm">
                <div>
                  <p className="font-semibold">
                    {c.code ?? "Unnamed class"}
                    {c.title && <span className="font-normal text-muted"> · {c.title}</span>}
                  </p>
                  {c.meetings.map((m) => (
                    <p key={`${m.days}-${m.start}`} className="text-muted">
                      {m.days.join(", ")} {formatTime(m.start)}–{formatTime(m.end)}
                      {m.location && ` · ${m.location}`}
                    </p>
                  ))}
                  <p className="text-xs text-muted">{c.startDate} to {c.endDate}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs font-semibold text-red-700 hover:underline"
                  onClick={() => update({ ...schedule, courses: schedule.courses.filter((_, j) => j !== i) })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <Button type="button" variant="outline" onClick={() => { setStep("choose"); setError(""); }}>
          Import a different schedule
        </Button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-brand">Saved.</span>}
          <Button type="button" onClick={handleSave}>Save schedule</Button>
        </div>
      </div>
    </div>
  );
}

function AddFreeTime({ onAdd }: { onAdd: (block: Block) => void }) {
  const [day, setDay] = useState<Day>("Mon");
  const [start, setStart] = useState(12 * 60);
  const [end, setEnd] = useState(13 * 60);
  const valid = end - start >= MIN_FREE_MINUTES;
  const select = "rounded-lg border border-border bg-surface px-2 py-2 text-sm";

  return (
    <fieldset className="flex flex-wrap items-end gap-2 rounded-xl border border-border p-3">
      <legend className="px-1 text-sm font-semibold">Add free time (every week)</legend>
      <label className="flex flex-col text-xs text-muted">
        Day
        <select className={select} value={day} onChange={(e) => setDay(e.target.value as Day)}>
          {DAYS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-xs text-muted">
        From
        <select className={select} value={start} onChange={(e) => setStart(Number(e.target.value))}>
          {TIMES.slice(0, -2).map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-xs text-muted">
        To
        <select className={select} value={end} onChange={(e) => setEnd(Number(e.target.value))}>
          {TIMES.slice(2).map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
        </select>
      </label>
      <Button type="button" variant="outline" disabled={!valid} onClick={() => onAdd({ day, start, end })}>
        Add
      </Button>
      {!valid && <p className="w-full text-xs text-red-700">Free time is at least {MIN_FREE_MINUTES} minutes.</p>}
    </fieldset>
  );
}
