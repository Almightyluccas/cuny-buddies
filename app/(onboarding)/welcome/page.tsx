import type { Metadata } from "next";
import OnboardingStep from "@/components/OnboardingStep";

export const metadata: Metadata = { title: "Create your profile · CUNY Buddies" };

export default function WelcomePage() {
  return <OnboardingStep stage="name" />;
}