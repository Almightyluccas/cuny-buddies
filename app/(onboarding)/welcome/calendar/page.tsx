import type { Metadata } from "next";
import OnboardingSchedule from "@/components/schedule/OnboardingSchedule";

export const metadata: Metadata = { title: "Your schedule · CUNY Buddies" };

export default function CalendarPage() {
  return <OnboardingSchedule />;
}
