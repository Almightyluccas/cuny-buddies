import type { Metadata } from "next";
import ProfileEditor from "@/components/ProfileEditor";

export const metadata: Metadata = { title: "My profile · CUNY Buddies" };

export default function MePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <ProfileEditor />
    </div>
  );
}
