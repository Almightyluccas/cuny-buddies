import type { Metadata } from "next";
import OnboardingStep from "@/components/OnboardingStep";

export const metadata: Metadata = { title: "Your clubs · CUNY Buddies" };

export default function ClubsPage() {
  return <OnboardingStep stage="clubs" />;
}
