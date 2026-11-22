"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import {
  BOROUGHS,
  CAMPUSES,
  isCampusId,
  type CampusId,
} from "@/lib/campuses";
import { currentUser } from "@/lib/mock-data";
import type { Gender, SocialLink, User } from "@/lib/types";

const STORAGE_KEY = "cuny-buddies:profile";

export type OnboardingStage =
  | "name"
  | "about"
  | "campus"
  | "looking-for"
  | "hobbies"
  | "clubs"
  | "socials"
  | "calendar";

type FormState = {
  firstName: string;
  lastName: string;
  showLastInitialOnly: boolean;
  age: string;
  gender: Gender;
  showGender: boolean;
  campusId: CampusId | "";
  majors: string;
  year: string;
  hobbies: string;
  clubs: string;
  lookingFor: string;
  instagram: string;
  linkedin: string;
  github: string;
};

const stages: { id: OnboardingStage; title: string }[] = [
  { id: "name", title: "Your name" },
  { id: "about", title: "About you" },
  { id: "campus", title: "Campus life" },
  { id: "looking-for", title: "What you’re looking for" },
  { id: "hobbies", title: "Hobbies" },
  { id: "clubs", title: "Clubs" },
  { id: "socials", title: "Social links" },
  { id: "calendar", title: "Weekly availability" },
];

const choiceSteps = {
  "looking-for": {
    field: "lookingFor",
    heading: "What are you looking for?",
    description: "Choose the kinds of connections you’d like to make at CUNY.",
    options: [
      "Friends",
      "Study mates",
      "Classmates",
      "Project partners",
      "Mentors",
      "Networking",
      "Campus activities",
      "Connections",
    ],
  },
  hobbies: {
    field: "hobbies",
    heading: "What do you enjoy?",
    description: "Pick a few hobbies to help classmates find things in common.",
    options: [
      "Basketball",
      "Photography",
      "Music",
      "Gaming",
      "Reading",
      "Cooking",
      "Hiking",
      "Dancing",
      "Art & design",
      "Fitness",
      "Movies",
      "Chess",
      "Travel",
      "Writing",
      "Coding",
    ],
  },
  clubs: {
    field: "clubs",
    heading: "Which clubs are you interested in?",
    description: "Select clubs you’re part of or would like to explore.",
    options: [
      "ACM",
      "Women in CS",
      "Robotics Club",
      "Debate Society",
      "Student Government",
      "Anime Club",
      "Pre-Law Society",
      "Dance Team",
      "Environmental Club",
      "Business Club",
      "Photography Club",
      "Cultural clubs",
    ],
  },
} as const;

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

function socialsToFields(socials: SocialLink[]) {
  const getUrl = (label: string) =>
    socials.find(
      (social) => social.label.trim().toLowerCase() === label.toLowerCase(),
    )?.url ?? "";

  return {
    instagram: getUrl("Instagram"),
    linkedin: getUrl("LinkedIn"),
    github: getUrl("GitHub"),
  };
}

function fieldsToSocials(fields: Pick<FormState, "instagram" | "linkedin" | "github">) {
  return [
    { label: "Instagram", url: fields.instagram },
    { label: "LinkedIn", url: fields.linkedin },
    { label: "GitHub", url: fields.github },
  ].flatMap(({ label, url }) => {
    const trimmedUrl = url.trim();
    return trimmedUrl ? [{ label, url: trimmedUrl }] : [];
  });
}

function emptyForm(): FormState {
  return {
    firstName: "",
    lastName: "",
    showLastInitialOnly: true,
    age: "",
    gender: "female",
    showGender: true,
    campusId: "",
    majors: "",
    year: "",
    hobbies: "",
    clubs: "",
    lookingFor: "Friends, Study mates",
    instagram: "",
    linkedin: "",
    github: "",
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
    campusId: isCampusId(user.campusId) ? user.campusId : "",
    majors: arrayToCsv(user.majors),
    year: user.year,
    hobbies: arrayToCsv(user.hobbies),
    clubs: arrayToCsv(user.clubs),
    lookingFor: arrayToCsv(user.lookingFor),
    ...socialsToFields(user.socials),
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
    campusId: isCampusId(form.campusId) ? form.campusId : currentUser.campusId,
    majors: csvToArray(form.majors),
    year: form.year.trim(),
    hobbies: csvToArray(form.hobbies),
    clubs: csvToArray(form.clubs),
    lookingFor: csvToArray(form.lookingFor),
    socials: fieldsToSocials(form),
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
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherAnswer, setOtherAnswer] = useState("");
  const stageIndex = stages.findIndex((item) => item.id === stage);
  const user = formToUser(form);
  const choiceStep =
    stage === "looking-for" || stage === "hobbies" || stage === "clubs"
      ? choiceSteps[stage]
      : null;

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

  function toggleChoice(key: "lookingFor" | "hobbies" | "clubs", option: string) {
    const choices = csvToArray(form[key]);
    const selected = choices.some(
      (choice) => choice.toLocaleLowerCase() === option.toLocaleLowerCase(),
    );
    update(
      key,
      arrayToCsv(
        selected
          ? choices.filter(
              (choice) =>
                choice.toLocaleLowerCase() !== option.toLocaleLowerCase(),
            )
          : [...choices, option],
      ),
    );
  }

  function addOtherChoice() {
    if (!choiceStep) return;
    const answer = otherAnswer.trim();
    if (!answer) return;

    const key = choiceStep.field;
    const choices = csvToArray(form[key]);
    if (
      !choices.some(
        (choice) => choice.toLocaleLowerCase() === answer.toLocaleLowerCase(),
      )
    ) {
      update(key, arrayToCsv([...choices, answer]));
    }
    setOtherAnswer("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stageIndex < 0) {
      setError("This onboarding page could not be found.");
      return;
    }
    if (stage === "campus" && !isCampusId(form.campusId)) {
      setError("Select your primary campus to continue.");
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
                    <Field label="Primary campus">
                      <select
                        className={inputClass}
                        value={form.campusId}
                        onChange={(event) =>
                          update(
                            "campusId",
                            event.target.value as CampusId | "",
                          )
                        }
                      >
                        <option value="">Select your primary campus</option>
                        {BOROUGHS.map((borough) => (
                          <optgroup key={borough} label={borough}>
                            {CAMPUSES.filter((campus) => campus.borough === borough).map(
                              (campus) => (
                                <option key={campus.id} value={campus.id}>
                                  {campus.name}
                                </option>
                              ),
                            )}
                          </optgroup>
                        ))}
                      </select>
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

              {choiceStep && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-bold">{choiceStep.heading}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {choiceStep.description}
                    </p>
                  </div>
                  <div
                    role="group"
                    aria-label={choiceStep.heading}
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                  >
                    {choiceStep.options.map((option) => {
                      const selected = csvToArray(form[choiceStep.field]).some(
                        (choice) =>
                          choice.toLocaleLowerCase() ===
                          option.toLocaleLowerCase(),
                      );
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleChoice(choiceStep.field, option)}
                          className={`min-h-12 touch-manipulation cursor-pointer select-none rounded-xl border px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] ${
                            selected
                              ? "border-brand bg-brand-soft text-brand-soft-fg"
                              : "border-border bg-surface hover:bg-bg"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-pressed={otherOpen}
                      aria-expanded={otherOpen}
                      onClick={() => setOtherOpen((open) => !open)}
                      className={`min-h-12 touch-manipulation cursor-pointer select-none rounded-xl border px-3 py-2 text-sm font-semibold transition-colors active:scale-[0.98] ${
                        otherOpen
                          ? "border-brand bg-brand-soft text-brand-soft-fg"
                          : "border-border bg-surface hover:bg-bg"
                      }`}
                    >
                      Other
                    </button>
                  </div>
                  {otherOpen && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        aria-label="Add your own answer"
                        placeholder="Type your own answer"
                        className={inputClass}
                        value={otherAnswer}
                        onChange={(event) => setOtherAnswer(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addOtherChoice();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addOtherChoice}
                        disabled={!otherAnswer.trim()}
                        className="shrink-0"
                      >
                        Add answer
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted">
                    Select as many as you like. Your choices save automatically.
                  </p>
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
                  <Field label="Instagram">
                    <input
                      type="text"
                      inputMode="url"
                      placeholder="https://instagram.com/yourname (optional)"
                      className={inputClass}
                      value={form.instagram}
                      onChange={(event) => update("instagram", event.target.value)}
                    />
                  </Field>
                  <Field label="LinkedIn">
                    <input
                      type="text"
                      inputMode="url"
                      placeholder="https://linkedin.com/in/yourname (optional)"
                      className={inputClass}
                      value={form.linkedin}
                      onChange={(event) => update("linkedin", event.target.value)}
                    />
                  </Field>
                  <Field label="GitHub">
                    <input
                      type="text"
                      inputMode="url"
                      placeholder="https://github.com/yourname (optional)"
                      className={inputClass}
                      value={form.github}
                      onChange={(event) => update("github", event.target.value)}
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
