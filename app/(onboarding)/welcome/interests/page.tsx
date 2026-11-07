import type { Metadata } from "next";
import OnboardingStep from "@/components/OnboardingStep";

export const metadata: Metadata = { title: "Your interests · CUNY Buddies" };

export default function InterestsPage() {
  return <OnboardingStep stage="interests" />;
}
