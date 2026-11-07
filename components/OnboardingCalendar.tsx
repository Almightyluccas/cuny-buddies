"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { currentUser } from "@/lib/mock-data";
import type { User } from "@/lib/types";

const STORAGE_KEY = "cuny-buddies:profile";
const DAYS = [
  { id: "Sun", label: "Sun", fullName: "Sunday" },
  { id: "Mon", label: "Mon", fullName: "Monday" },
  { id: "Tue", label: "Tue", fullName: "Tuesday" },
  { id: "Wed", label: "Wed", fullName: "Wednesday" },
  { id: "Thu", label: "Thu", fullName: "Thursday" },
  { id: "Fri", label: "Fri", fullName: "Friday" },
  { id: "Sat", label: "Sat", fullName: "Saturday" },
] as const;
const START_SLOT = 9 * 4;
const END_SLOT = 21 * 4;

function slotKey(day: string, slot: number) {
  return `${day}-${slot}`;
}

function parseSlotKey(key: string) {
  const separator = key.lastIndexOf("-");
  const day = key.slice(0, separator);
  const slot = Number(key.slice(separator + 1));
  if (
    !DAYS.some((item) => item.id === day) ||
    !Number.isInteger(slot) ||
    slot < START_SLOT ||
    slot >= END_SLOT
  ) {
    return false;
  }
  return true;
}

function formatTime(slot: number) {
  const hour = Math.floor(slot / 4);
  const minutes = (slot % 4) * 15;
  const suffix = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function loadUnavailableSlots(): string[] {
  const rawProfile = localStorage.getItem(STORAGE_KEY);
  if (!rawProfile) return [];
  const profile = JSON.parse(rawProfile) as User;
  if (!Array.isArray(profile.unavailableSlots)) return [];
  return profile.unavailableSlots.filter(
    (key): key is string => typeof key === "string" && parseSlotKey(key),
  );
}

export default function OnboardingCalendar({
  mode = "onboarding",
}: {
  mode?: "onboarding" | "profile";
}) {
  const router = useRouter();
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const unavailableRef = useRef<Set<string>>(new Set());
  const drag = useRef<{
    pointerId: number;
    selected: boolean;
    lastKey: string;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = new Set(loadUnavailableSlots());
      unavailableRef.current = saved;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      setUnavailable(saved);
    } catch {
      setError("We couldn’t load your saved availability. Please refresh and try again.");
    }

    function stopDragging(event: PointerEvent) {
      if (drag.current?.pointerId === event.pointerId) {
        drag.current = null;
      }
    }

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, []);

  function saveSlots(slots: Set<string>) {
    const rawProfile = localStorage.getItem(STORAGE_KEY);
    const profile = rawProfile
      ? (JSON.parse(rawProfile) as User)
      : currentUser;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...profile, unavailableSlots: [...slots] }),
    );
  }

  function setSlot(key: string, selected: boolean) {
    const current = unavailableRef.current;
    if (current.has(key) === selected) return;

    const updated = new Set(current);
    if (selected) updated.add(key);
    else updated.delete(key);
    unavailableRef.current = updated;
    setUnavailable(updated);

    try {
      saveSlots(updated);
      setError("");
    } catch {
      setError("We couldn’t save your availability in this browser. Check storage settings and try again.");
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const activeDrag = drag.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const button =
      target instanceof Element
        ? target.closest<HTMLButtonElement>("[data-slot-key]")
        : null;
    const key = button?.dataset.slotKey;
    if (!key || key === activeDrag.lastKey) return;

    activeDrag.lastKey = key;
    setSlot(key, activeDrag.selected);
  }

  function handleFinish() {
    try {
      saveSlots(unavailableRef.current);
      router.push("/me");
    } catch {
      setError("We couldn’t save your availability in this browser. Check storage settings and try again.");
    }
  }

  const content = (
    <>
      {mode === "onboarding" && (
        <>
          <header className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar initials="CB" size="sm" />
              <span className="font-bold">CUNY Buddies</span>
            </div>
            <Button href="/welcome/socials" variant="outline" className="px-4 py-2">
              Back
            </Button>
          </header>

          <div className="mb-7 text-center">
            <p className="text-sm font-semibold text-brand">YOUR CUNY COMMUNITY</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Let’s set up your profile
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              Mark the times you’re unavailable. Click or drag across the calendar
              to select 15-minute blocks.
            </p>
          </div>
        </>
      )}

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-8">
          {mode === "onboarding" ? (
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold">Step 6 of 6</span>
                <span className="text-muted">Weekly availability</span>
              </div>
              <div
                role="progressbar"
                aria-label="Profile setup progress"
                aria-valuemin={1}
                aria-valuemax={6}
                aria-valuenow={6}
                className="h-2 overflow-hidden rounded-full bg-brand-soft"
              >
                <div className="h-full w-full rounded-full bg-brand" />
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="text-xl font-bold">Weekly availability</h2>
              <p className="mt-1 text-sm text-muted">
                Click or drag across the calendar to edit your unavailable times.
                Changes save automatically.
              </p>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Selected time is <span className="font-semibold text-foreground">unavailable</span>.
            </p>
            <p className="text-sm font-medium" aria-live="polite">
              {unavailable.size} blocks · {Math.floor((unavailable.size * 15) / 60)}h{" "}
              {(unavailable.size * 15) % 60}m selected
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <div className="min-w-[760px]">
              <div className="sticky top-0 z-10 grid grid-cols-[4.25rem_repeat(7,minmax(0,1fr))] border-b border-border bg-surface">
                <div aria-hidden className="border-r border-border" />
                {DAYS.map((day) => (
                  <div
                    key={day.id}
                    className="border-r border-border px-1 py-3 text-center text-xs font-semibold last:border-r-0 sm:text-sm"
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              <div onPointerMove={handlePointerMove}>
                {Array.from(
                  { length: END_SLOT - START_SLOT },
                  (_, index) => {
                    const slot = START_SLOT + index;
                    const hourLabel = slot % 4 === 0;

                    return (
                      <div
                        key={slot}
                        className="grid grid-cols-[4.25rem_repeat(7,minmax(0,1fr))]"
                      >
                        {hourLabel ? (
                          <div
                            className="h-3 border-r border-b border-border pr-1 text-right text-[10px] leading-3 text-muted"
                            aria-hidden
                          >
                            {formatTime(slot)}
                          </div>
                        ) : (
                          <div
                            className="h-3 border-r border-b border-border"
                            aria-hidden
                          />
                        )}
                        {DAYS.map((day) => {
                          const key = slotKey(day.id, slot);
                          const selected = unavailable.has(key);

                          return (
                            <button
                              key={day.id}
                              type="button"
                              data-slot-key={key}
                              aria-label={`${day.fullName}, ${formatTime(slot)}, ${selected ? "unavailable" : "available"}`}
                              aria-pressed={selected}
                              title={`${day.fullName} ${formatTime(slot)}`}
                              onPointerDown={(event) => {
                                if (event.button !== 0) return;
                                event.preventDefault();
                                event.currentTarget.setPointerCapture(event.pointerId);
                                const nextSelected = !unavailableRef.current.has(key);
                                drag.current = {
                                  pointerId: event.pointerId,
                                  selected: nextSelected,
                                  lastKey: key,
                                };
                                setSlot(key, nextSelected);
                              }}
                              onClick={(event) => {
                                if (event.detail === 0) {
                                  setSlot(key, !unavailableRef.current.has(key));
                                }
                              }}
                              className={`h-3 touch-none select-none border-r border-b border-border transition-colors last:border-r-0 ${
                                selected
                                  ? "bg-brand hover:bg-brand-hover"
                                  : "bg-surface hover:bg-brand-soft"
                              }`}
                            />
                          );
                        })}
                      </div>
                    );
                  },
                )}
                <div className="grid grid-cols-[4.25rem_repeat(7,minmax(0,1fr))]">
                  <div
                    className="h-3 border-r border-border pr-1 text-right text-[10px] leading-3 text-muted"
                    aria-hidden
                  >
                    {formatTime(END_SLOT)}
                  </div>
                  {DAYS.map((day) => (
                    <div
                      key={day.id}
                      className="h-3 border-r border-border last:border-r-0"
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted">
            Times use your local timezone. Click a block to toggle it, or drag
            across multiple blocks to edit them together.
          </p>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {mode === "onboarding" && (
            <div className="mt-7 flex justify-end border-t border-border pt-5">
              <Button type="button" onClick={handleFinish}>
                Finish profile
              </Button>
            </div>
          )}
        </section>
    </>
  );

  if (mode === "profile") return content;

  return (
    <main className="min-h-screen bg-bg px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">{content}</div>
    </main>
  );
}
