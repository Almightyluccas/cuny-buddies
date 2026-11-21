import type { Metadata } from "next";
import OnboardingStep from "@/components/OnboardingStep";

export const metadata: Metadata = { title: "Your hobbies · CUNY Buddies" };

export default function HobbiesPage() {
  return <OnboardingStep stage="hobbies" />;
}
