import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileHeader from "@/components/ProfileHeader";
import Tag from "@/components/Tag";
import {
  getMatchDetail,
  getUser,
  matchPercentById,
  mockUsers,
} from "@/lib/mock-data";
import { displayName } from "@/lib/types";

export function generateStaticParams() {
  return mockUsers.map((u) => ({ id: u.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/profile/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = getUser(id);
  return {
    title: user ? `${displayName(user)} · CUNY Buddies` : "Profile",
  };
}

export default async function ProfilePage({
  params,
}: PageProps<"/profile/[id]">) {
  const { id } = await params;
  const user = getUser(id);
  const match = getMatchDetail(id);
  if (!user) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/matches"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
      >
        <span aria-hidden>&lsaquo;</span> Back to matches
      </Link>

      <ProfileHeader user={user} matchPercent={matchPercentById[id]} />

      {/* Hobbies & clubs */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-muted">Hobbies</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.hobbies.map((h) => (
              <Tag key={h} variant={h === "Basketball" ? "active" : "soft"}>
                {h === "Basketball" ? "Basketball · shared" : h}
              </Tag>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-muted">Clubs</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.clubs.map((c) => (
              <Tag key={c} variant="soft">
                {c}
              </Tag>
            ))}
          </div>
        </div>
      </section>

      {match && (
        <>
          {/* You share */}
          <section className="rounded-2xl bg-brand p-6 text-white">
            <h2 className="text-lg font-bold">You share</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {match.sharedClasses.map((c) => (
                <div key={c.name} className="rounded-xl bg-white/15 p-4">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-white/80">{c.meets}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-6 text-sm font-semibold text-white/80">
              Free at the same time
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {match.freeSlots.map((slot) => {
                const free = slot.time !== null;
                return (
                  <div
                    key={slot.day}
                    className={`rounded-xl p-3 text-center ${
                      free
                        ? "border-2 border-white bg-white text-foreground"
                        : "bg-white/15 text-white/70"
                    }`}
                  >
                    <p className="text-sm font-semibold">{slot.day}</p>
                    <p className="text-xs">{slot.time ?? "—"}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Idea */}
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-sm font-semibold text-muted">Idea</h2>
            <p className="mt-2">{match.idea}</p>
          </section>
        </>
      )}

      {/* Locked */}
      <section className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-6 text-muted">
        <span aria-hidden>🔒</span>
        <p className="text-sm">
          Full schedule, socials and chat unlock once you&apos;re friends.
        </p>
      </section>
    </div>
  );
}
