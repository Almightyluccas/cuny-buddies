"use client";

// Editable "my profile" form. Persists to localStorage for now; the MongoDB
// write is a separate backend task. Nothing leaves the browser.

import { useEffect, useState } from "react";
import Button from "@/components/Button";
import {
  displayName,
  type Gender,
  type SocialLink,
  type User,
} from "@/lib/types";
import { currentUser } from "@/lib/mock-data";

const STORAGE_KEY = "cuny-buddies:profile";

// The form keeps list fields as raw strings so they are easy to type into.
type FormState = {
  firstName: string;
  lastName: string;
  showLastInitialOnly: boolean;
  age: string;
  gender: Gender;
  showGender: boolean;
  school: string;
  majors: string; // comma separated
  year: string;
  hobbies: string; // comma separated
  clubs: string; // comma separated
  lookingFor: string; // comma separated
  socials: string; // one per line: "Label, https://..."
};

const csvToArr = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const arrToCsv = (a: string[]) => a.join(", ");

function socialsToText(socials: SocialLink[]) {
  return socials.map((s) => `${s.label}, ${s.url}`).join("\n");
}

function textToSocials(text: string): SocialLink[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(",");
      return { label: label.trim(), url: rest.join(",").trim() };
    })
    .filter((s) => s.label && s.url);
}

function userToForm(u: User): FormState {
  return {
    firstName: u.firstName,
    lastName: u.lastName,
    showLastInitialOnly: u.showLastInitialOnly,
    age: String(u.age),
    gender: u.gender,
    showGender: u.showGender,
    school: u.school,
    majors: arrToCsv(u.majors),
    year: u.year,
    hobbies: arrToCsv(u.hobbies),
    clubs: arrToCsv(u.clubs),
    lookingFor: arrToCsv(u.lookingFor),
    socials: socialsToText(u.socials),
  };
}

function formToUser(f: FormState): User {
  return {
    id: currentUser.id,
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    showLastInitialOnly: f.showLastInitialOnly,
    age: Number(f.age) || 0,
    gender: f.gender,
    showGender: f.showGender,
    school: f.school.trim(),
    majors: csvToArr(f.majors),
    year: f.year.trim(),
    hobbies: csvToArr(f.hobbies),
    clubs: csvToArr(f.clubs),
    lookingFor: csvToArr(f.lookingFor),
    socials: textToSocials(f.socials),
  };
}

export default function ProfileEditor() {
  const [form, setForm] = useState<FormState>(() => userToForm(currentUser));
  const [saved, setSaved] = useState(false);

  // Hydrate from localStorage after mount. This must run in an effect, not a
  // lazy initializer: localStorage is unavailable during SSR, so reading it in
  // render would cause a hydration mismatch. One-time sync from a browser store.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      if (stored) setForm(userToForm(JSON.parse(stored) as User));
    } catch {
      // ignore unavailable/corrupt storage; fall back to defaults
    }
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formToUser(form)));
      setSaved(true);
    } catch {
      // storage unavailable (e.g. private window); leave UI unchanged
    }
  }

  const input =
    "rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="text-2xl font-bold">My profile</h1>
        <p className="mt-1 text-muted">
          Shown to classmates as{" "}
          <span className="font-semibold text-foreground">
            {displayName(formToUser(form))}
          </span>
          .
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="First name">
            <input
              className={input}
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Last name">
            <input
              className={input}
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </Field>

          <Toggle
            label="Show only first letter of last name"
            checked={form.showLastInitialOnly}
            onChange={(v) => set("showLastInitialOnly", v)}
          />
          <Field label="Age">
            <input
              type="number"
              min={0}
              className={input}
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
            />
          </Field>

          <Field label="Gender">
            <select
              className={input}
              value={form.gender}
              onChange={(e) => set("gender", e.target.value as Gender)}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </Field>
          <Toggle
            label="Show gender on profile"
            checked={form.showGender}
            onChange={(v) => set("showGender", v)}
          />

          <Field label="School">
            <input
              className={input}
              value={form.school}
              onChange={(e) => set("school", e.target.value)}
            />
          </Field>
          <Field label="Year">
            <input
              className={input}
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
            />
          </Field>

          <Field label="Majors (comma separated)">
            <input
              className={input}
              value={form.majors}
              onChange={(e) => set("majors", e.target.value)}
            />
          </Field>
          <Field label="Looking for (comma separated)">
            <input
              className={input}
              value={form.lookingFor}
              onChange={(e) => set("lookingFor", e.target.value)}
            />
          </Field>

          <Field label="Hobbies (comma separated)">
            <input
              className={input}
              value={form.hobbies}
              onChange={(e) => set("hobbies", e.target.value)}
            />
          </Field>
          <Field label="Clubs (comma separated)">
            <input
              className={input}
              value={form.clubs}
              onChange={(e) => set("clubs", e.target.value)}
            />
          </Field>

          <Field label="Social links (one per line: Label, URL)" full>
            <textarea
              rows={3}
              className={input}
              value={form.socials}
              onChange={(e) => set("socials", e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button type="submit">Save changes</Button>
          {saved && (
            <span className="text-sm font-medium text-brand">Saved.</span>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-2 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 self-end py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-brand"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}
