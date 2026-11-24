import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import Sidebar from "@/components/Sidebar";

async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  await connection();
  await withAuth({ ensureSignedIn: true });

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-10">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-bg"
          aria-busy="true"
          aria-label="Loading your account"
        />
      }
    >
      <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>
    </Suspense>
  );
}
