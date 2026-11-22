"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";
import WeekCalendar from "@/components/schedule/WeekCalendar";
import { initialWeek, localToday } from "@/lib/schedule/free-time";
import type { Schedule } from "@/lib/schedule/model";
import { loadSchedule } from "@/lib/schedule/storage";

export default function MyWeek() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [week, setWeek] = useState(""); // set after mount: dates can't be prerendered

  useEffect(() => {
    const stored = loadSchedule();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setSchedule(stored);
    setWeek(stored ? initialWeek(stored, localToday()) : localToday());
    setLoaded(true);
  }, []);

  if (!loaded) return null;
  if (!schedule) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-10 text-center">
        <h1 className="text-2xl font-bold">My week</h1>
        <p className="mt-2 text-muted">Add your schedule to see your classes and free time.</p>
        <Button href="/me#schedule" className="mt-5">Add schedule</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My week</h1>
        <Button href="/me#schedule" variant="outline" className="px-4 py-2">Edit schedule</Button>
      </div>
      <WeekCalendar schedule={schedule} week={week} onWeekChange={setWeek} />
    </div>
  );
}
