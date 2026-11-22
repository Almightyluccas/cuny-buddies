"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import ScheduleSetup from "@/components/schedule/ScheduleSetup";

const PROFILE_KEY = "cuny-buddies:profile";

// Last onboarding step: import the schedule or enter free time.
export default function OnboardingSchedule() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem(PROFILE_KEY)) router.replace("/welcome");
  }, [router]);

  return (
    <main className="min-h-screen bg-bg px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
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
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Add your schedule</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            We find your free time between classes so you can meet people who are free when you are.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-8">
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-semibold">Step 8 of 8</span>
              <span className="text-muted">Schedule</span>
            </div>
            <div
              role="progressbar"
              aria-label="Profile setup progress"
              aria-valuemin={1}
              aria-valuemax={8}
              aria-valuenow={8}
              className="h-2 overflow-hidden rounded-full bg-brand-soft"
            >
              <div className="h-full w-full rounded-full bg-brand" />
            </div>
          </div>
          <ScheduleSetup onFinish={() => router.push("/me")} />
        </section>
      </div>
    </main>
  );
}
