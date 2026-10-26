import type { Metadata } from "next";

export const metadata: Metadata = { title: "Friends · CUNY Buddies" };

export default function FriendsPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-10 text-center">
      <h1 className="text-2xl font-bold">Friends</h1>
      <p className="mt-2 text-muted">
        Your friends and chats will show up here once matching is live.
      </p>
    </div>
  );
}
