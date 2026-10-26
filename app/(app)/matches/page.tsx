import type { Metadata } from "next";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { getMatches, matchPercentById } from "@/lib/mock-data";
import { displayName, initials } from "@/lib/types";

export const metadata: Metadata = { title: "Matches · CUNY Buddies" };

export default function MatchesPage() {
  const matches = getMatches();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold">Matches</h1>
      <p className="mt-1 text-muted">
        Classmates who share your classes and your breaks.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((user) => (
          <Link
            key={user.id}
            href={`/profile/${user.id}`}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand"
          >
            <div className="flex items-center gap-4">
              <Avatar initials={initials(user)} size="md" />
              <div>
                <p className="font-semibold">{displayName(user)}</p>
                <p className="text-sm text-muted">
                  {user.school} · {user.year}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">
                {user.majors.join(" & ")}
              </span>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-soft-fg">
                {matchPercentById[user.id] ?? 0}% match
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
