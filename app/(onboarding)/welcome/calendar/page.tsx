import type { Metadata } from "next";
import OnboardingCalendar from "@/components/OnboardingCalendar";

export const metadata: Metadata = { title: "Weekly availability · CUNY Buddies" };

export default function CalendarPage() {
  return <OnboardingCalendar />;
}