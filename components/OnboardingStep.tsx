"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import type { Gender, SocialLink, User } from "@/lib/types";

const STORAGE_KEY = "cuny-buddies:profile";

export type OnboardingStage =
  | "name"
  | "about"
  | "campus"
  | "interests"
  | "socials"
  | "calendar";

type FormState = {
  firstName: string;
  lastName: string;
  showLastInitialOnly: boolean;
  age: string;
  gender: Gender;
  showGender: boolean;
  school: string;
  majors: string;
  year: string;
  hobbies: string;
  clubs: string;
  lookingFor: string;
  socials: string;
  unavailableSlots: string[];
};

const stages: { id: OnboardingStage; title: string }[] = [
  { id: "name", title: "Your name" },
  { id: "about", title: "About you" },
  { id: "campus", title: "Campus life" },
  { id: "interests", title: "Interests" },
  { id: "socials", title: "Social links" },
  { id: "calendar", title: "Weekly availability" },
];

function stageHref(stage: OnboardingStage): string {
  return stage === "name" ? "/welcome" : `/welcome/${stage}`;
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";
const csvToArray = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const arrayToCsv = (items: string[]) => items.join(", ");

function socialsToText(socials: SocialLink[]) {
  return socials.map(({ label, url }) => `${label}, ${url}`).join("\n");
}

function textToSocials(value: string): SocialLink[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...urlParts] = line.split(",");
      return { label: label.trim(), url: urlParts.join(",").trim() };
    })
    .filter((social) => social.label && social.url);
}

function emptyForm(): FormState {
  return {
    firstName: "",
    lastName: "",
    showLastInitialOnly: true,
    age: "",
    gender: "female",
    showGender: false,
    school: "",
    majors: "",
    year: "",
    hobbies: "",
    clubs: "",
    lookingFor: "Friends, Study mates",
    socials: "",
    unavailableSlots: [],
  };
}

function userToForm(user: User): FormState {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    showLastInitialOnly: user.showLastInitialOnly,
    age: user.age ? String(user.age) : "",
    gender: user.gender,
    showGender: user.showGender,
    school: user.school,
    majors: arrayToCsv(user.majors),
    year: user.year,
    hobbies: arrayToCsv(user.hobbies),
    clubs: arrayToCsv(user.clubs),
    lookingFor: arrayToCsv(user.lookingFor),
    socials: socialsToText(user.socials),
    unavailableSlots: user.unavailableSlots ?? [],
  };
}

function formToUser(form: FormState): User {
  return {
    id: "me",
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    showLastInitialOnly: form.showLastInitialOnly,
    age: Number(form.age) || 0,
    gender: form.gender,
    showGender: form.showGender,
    school: form.school.trim(),
    majors: csvToArray(form.majors),
    year: form.year.trim(),
    hobbies: csvToArray(form.hobbies),
    clubs: csvToArray(form.clubs),
    lookingFor: csvToArray(form.lookingFor),
    socials: textToSocials(form.socials),
    unavailableSlots: form.unavailableSlots,
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
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
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-brand"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

export default function OnboardingStep({
  stage,
}: {
  stage: OnboardingStage;
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const stageIndex = stages.findIndex((item) => item.id === stage);
  const user = formToUser(form);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as User;
        if (
          parsed &&
          typeof parsed.firstName === "string" &&
          typeof parsed.lastName === "string" &&
          Array.isArray(parsed.majors) &&
          Array.isArray(parsed.socials)
        ) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
          setForm(userToForm(parsed));
        }
      }
    } catch {
      setError("We couldn’t load your saved profile. Please refresh and try again.");
    }
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    const updated = { ...form, [key]: value };
    setForm(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formToUser(updated)));
      setError("");
    } catch {
      setError("We couldn’t save your changes in this browser. Check storage settings and try again.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stageIndex < 0) {
      setError("This onboarding page could not be found.");
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      setError("");
    } catch {
      setError("We couldn’t save your profile in this browser. Check storage settings and try again.");
      return;
    }

    if (stageIndex === stages.length - 1) {
      router.push("/me");
      return;
    }
    router.push(stageHref(stages[stageIndex + 1].id));
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar initials="CB" size="sm" />
            <span className="font-bold">CUNY Buddies</span>
          </div>
          <Button href="/" variant="outline" className="px-4 py-2">
            Back to sign in
          </Button>
        </header>

        <div className="mb-7 text-center">
          <p className="text-sm font-semibold text-brand">YOUR CUNY COMMUNITY</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Let’s set up your profile
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Answer a few quick questions to introduce yourself to classmates.
          </p>
        </div>

        <div>
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold">
                  Step {stageIndex + 1} of {stages.length}
                </span>
                <span className="text-muted">{stages[stageIndex]?.title}</span>
              </div>
              <div
                role="progressbar"
                aria-label="Profile setup progress"
                aria-valuemin={1}
                aria-valuemax={stages.length}
                aria-valuenow={stageIndex + 1}
                className="h-2 overflow-hidden rounded-full bg-brand-soft"
              >
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{
                    width: `${((stageIndex + 1) / stages.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {stage === "name" && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-bold">What should we call you?</h2>
                    <p className="mt-1 text-sm text-muted">
                      Choose how you’d like classmates to see your name.
                    </p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="First name">
                      <input
                        autoComplete="given-name"
                        className={inputClass}
                        value={form.firstName}
                        onChange={(event) => update("firstName", event.target.value)}
                      />
                    </Field>
                    <Field label="Last name">
                      <input
                        autoComplete="family-name"
                        className={inputClass}
                        value={form.lastName}
                        onChange={(event) => update("lastName", event.target.value)}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Toggle
                        label="Show only the first letter of my last name"
                        checked={form.showLastInitialOnly}
                        onChange={(value) => update("showLastInitialOnly", value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {stage === "about" && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-bold">A little more about you</h2>
                    <p className="mt-1 text-sm text-muted">
                      Age and gender are optional. You control what appears on your profile.
                    </p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Age" hint="Optional">
                      <input
                        type="number"
                        min={0}
                        max={120}
                        className={inputClass}
                        value={form.age}
                        onChange={(event) => update("age", event.target.value)}
                      />
                    </Field>
                    <Field label="Gender">
                      <select
                        className={inputClass}
                        value={form.gender}
                        onChange={(event) =>
                          update("gender", event.target.value as Gender)
                        }
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Toggle
                        label="Show my gender on my profile"
                        checked={form.showGender}
                        onChange={(value) => update("showGender", value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {stage === "campus" && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-bold">Where do you study?</h2>
                    <p className="mt-1 text-sm text-muted">
                      Add your CUNY college, major, and year.
                    </p>
                  </div>
                  <div className="flex flex-col gap-5">
                    <Field label="CUNY college">
                      <input
                        autoComplete="organization"
                        placeholder="e.g. City College"
                        className={inputClass}
                        value={form.school}
                        onChange={(event) => update("school", event.target.value)}
                      />
                    </Field>
                    <Field label="Major(s)" hint="Separate multiple majors with commas.">
                      <input
                        placeholder="e.g. Psychology, Biology"
                        className={inputClass}
                        value={form.majors}
                        onChange={(event) => update("majors", event.target.value)}
                      />
                    </Field>
                    <Field label="Year">
                      <input
                        placeholder="e.g. Sophomore"
                        className={inputClass}
                        value={form.year}
                        onChange={(event) => update("year", event.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {stage === "interests" && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-bold">Find your people</h2>
                    <p className="mt-1 text-sm text-muted">
                      Tell classmates what you’re into and what connections you want to make.
                    </p>
                  </div>
                  <div className="flex flex-col gap-5">
                    <Field
                      label="What are you looking for?"
                      hint="For example: friends, study mates, connections."
                    >
                      <input
                        className={inputClass}
                        value={form.lookingFor}
                        onChange={(event) => update("lookingFor", event.target.value)}
                      />
                    </Field>
                    <Field label="Hobbies" hint="Separate hobbies with commas.">
                      <input
                        placeholder="e.g. Basketball, reading, photography"
                        className={inputClass}
                        value={form.hobbies}
                        onChange={(event) => update("hobbies", event.target.value)}
                      />
                    </Field>
                    <Field label="Clubs" hint="Separate clubs with commas.">
                      <input
                        placeholder="e.g. Debate club, ACM"
                        className={inputClass}
                        value={form.clubs}
                        onChange={(event) => update("clubs", event.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {stage === "socials" && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-bold">Connect with classmates</h2>
                    <p className="mt-1 text-sm text-muted">
                      Add any social profiles you’d like to share. This step is optional.
                    </p>
                  </div>
                  <Field
                    label="Social links"
                    hint="One per line, in the format: Instagram, https://instagram.com/yourname"
                  >
                    <textarea
                      rows={5}
                      placeholder={"Instagram, https://instagram.com/yourname\nLinkedIn, https://linkedin.com/in/yourname"}
                      className={inputClass}
                      value={form.socials}
                      onChange={(event) => update("socials", event.target.value)}
                    />
                  </Field>
                  <p className="rounded-xl bg-brand-soft p-4 text-sm text-brand-soft-fg">
                    Your answers save as you type. You can edit them later from My profile.
                  </p>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-5 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
                {stageIndex > 0 ? (
                  <Button
                    href={stageHref(stages[stageIndex - 1].id)}
                    variant="outline"
                  >
                    Back
                  </Button>
                ) : (
                  <span />
                )}
                <Button href={stageHref(stages[stageIndex + 1].id)}>
                  Continue
                </Button>
              </div>
            </form>
          </section>

        </div>
      </div>
    </main>
  );
}
