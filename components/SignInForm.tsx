"use client";

// Static sign-in stub. Real auth (WorkOS email + password) is a separate backend
// task; for now "Continue" just navigates into the app.

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/Button";

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/matches");
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-3xl font-bold">Sign in</h2>
      <p className="mt-1 text-muted">Only CUNY email addresses can join.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">CUNY email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="firstname.lastname@login.cuny.edu"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
          />
        </label>

        <Button type="submit" className="w-full">
          Continue
        </Button>
        <Button href="/me" variant="outline" className="w-full">
          Create an account
        </Button>
      </form>
    </div>
  );
}
