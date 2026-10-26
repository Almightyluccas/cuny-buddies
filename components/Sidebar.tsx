"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const nav: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/my-week",
    label: "My week",
    icon: (
      <path d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    ),
  },
  {
    href: "/matches",
    label: "Matches",
    icon: (
      <path d="M16 11a4 4 0 1 0-4-4m8 14v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M9 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    ),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: (
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
    ),
  },
  {
    href: "/me",
    label: "My profile",
    icon: (
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-2 border-r border-border bg-bg p-4">
      <Link href="/matches" className="mb-4 flex items-center gap-2 px-2 py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
          CB
        </span>
        <span className="text-base font-bold">CUNY Buddies</span>
      </Link>

      {nav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
