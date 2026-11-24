import type { Metadata } from "next";
import OnboardingStep from "@/components/OnboardingStep";

export const metadata: Metadata = { title: "Social links · CUNY Buddies" };

export default function SocialsPage() {
  return <OnboardingStep stage="socials" />;
}
