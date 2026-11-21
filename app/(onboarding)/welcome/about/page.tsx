import type { Metadata } from "next";
import OnboardingStep from "@/components/OnboardingStep";

export const metadata: Metadata = { title: "About you · CUNY Buddies" };

export default function AboutPage() {
  return <OnboardingStep stage="about" />;
}
