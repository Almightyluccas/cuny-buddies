// User schema for CUNY Buddies. Mirrors the agreed schema; the MongoDB layer
// (separate task) will persist this shape.

export type Gender = "male" | "female";

export interface SocialLink {
  label: string; // e.g. "Instagram", "LinkedIn"
  url: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  showLastInitialOnly: boolean; // show only the first letter of the last name
  age: number;
  gender: Gender;
  showGender: boolean; // whether to display gender on the profile
  school: string; // e.g. "City College"
  majors: string[];
  year: string; // e.g. "Junior"
  hobbies: string[];
  clubs: string[];
  lookingFor: string[]; // "Study mates", "Friends", "Connections", or custom
  socials: SocialLink[];
}

export interface SharedClass {
  name: string; // "Operating Systems"
  meets: string; // "Mon & Wed 2:00-3:15"
}

export interface FreeSlot {
  day: string; // "Mon"
  time: string | null; // "10:45-3:30", or null when not free together
}

// Match-computed data for the demo. Kept separate from the user schema because
// the real matching algorithm and LLM scoring are a separate backend task.
export interface MatchDetail {
  userId: string;
  matchPercent: number;
  sharedClasses: SharedClass[];
  freeSlots: FreeSlot[];
  idea: string;
}

// "Maya R." when showLastInitialOnly, otherwise the full name.
export function displayName(user: User): string {
  const last = user.showLastInitialOnly
    ? `${user.lastName.charAt(0)}.`
    : user.lastName;
  return `${user.firstName} ${last}`.trim();
}

export function initials(user: User): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}
