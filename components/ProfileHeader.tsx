import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Tag from "@/components/Tag";
import { displayName, initials, type User } from "@/lib/types";

// Full-width, TikTok-style profile header: avatar left, identity + stats + bio
// + actions right, spanning the page.
export default function ProfileHeader({
  user,
  matchPercent,
}: {
  user: User;
  matchPercent?: number;
}) {
  return (
    <header className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar initials={initials(user)} size="lg" />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{displayName(user)}</h1>
            {matchPercent !== undefined && (
              <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-soft-fg">
                {matchPercent}% match
              </span>
            )}
          </div>
          <p className="mt-1 text-muted">
            {user.school} · {user.majors.join(" & ")} · {user.year}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {user.lookingFor.map((item) => (
              <Tag key={item} variant="outline">
                Looking for {item.toLowerCase()}
              </Tag>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button>Add friend</Button>
            <Button variant="outline" disabled>
              Message
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
