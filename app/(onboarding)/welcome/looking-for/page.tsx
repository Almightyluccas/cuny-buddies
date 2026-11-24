import type { Metadata } from "next";
import OnboardingStep from "@/components/OnboardingStep";

export const metadata: Metadata = {
  title: "What you’re looking for · CUNY Buddies",
};

export default function LookingForPage() {
  return <OnboardingStep stage="looking-for" />;
}
