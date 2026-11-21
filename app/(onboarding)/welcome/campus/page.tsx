import type { Metadata } from "next";
import OnboardingStep from "@/components/OnboardingStep";

export const metadata: Metadata = { title: "Your campus · CUNY Buddies" };

export default function CampusPage() {
  return <OnboardingStep stage="campus" />;
}
