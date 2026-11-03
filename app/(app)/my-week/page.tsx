import type { Metadata } from "next";

export const metadata: Metadata = { title: "My week · CUNY Buddies" };

export default function MyWeekPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-10 text-center">
      <h1 className="text-2xl font-bold">My week</h1>
      <p className="mt-2 text-muted">
        Your weekly schedule view is coming soon.
      </p>
    </div>
  );
}
