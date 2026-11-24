// Suggested first messages. User research (docs/) found that "nobody wants to
// go first", so the app offers an opener built from what two students share.

export type FreeBlock = {
  day: string; // e.g. "Tue"
  start: string; // e.g. "11:00"
  end: string; // e.g. "12:00"
};

export type SharedContext = {
  firstName: string;
  sharedClasses?: string[];
  sharedFreeBlocks?: FreeBlock[];
  sharedHobbies?: string[];
};

const ACTIVITIES = ["grab coffee", "study together", "get lunch"] as const;

export function formatBlock(block: FreeBlock): string {
  return `${block.day} ${block.start}–${block.end}`;
}

// The same pair always gets the same activity, so the suggestion doesn't
// change every time the screen renders.
export function pickActivity(seed: string): string {
  let sum = 0;
  for (const ch of seed) sum += ch.charCodeAt(0);
  return ACTIVITIES[sum % ACTIVITIES.length];
}

export function suggestIcebreaker(ctx: SharedContext): string {
  const name = ctx.firstName.trim() || "there";
  const course = ctx.sharedClasses?.[0];
  const block = ctx.sharedFreeBlocks?.[0];
  const hobby = ctx.sharedHobbies?.[0];
  const activity = pickActivity(name + (course ?? "") + (hobby ?? ""));

  if (course && block) {
    return `Hi ${name}! We're both in ${course} and free ${formatBlock(block)}. Want to ${activity}?`;
  }
  if (course) {
    return `Hi ${name}! We're both in ${course}. Want to ${activity} before the next class?`;
  }
  if (block && hobby) {
    return `Hi ${name}! We both like ${hobby.toLowerCase()} and we're free ${formatBlock(block)}. Want to meet up?`;
  }
  if (block) {
    return `Hi ${name}! We're both free ${formatBlock(block)}. Want to ${activity}?`;
  }
  if (hobby) {
    return `Hi ${name}! I saw you're into ${hobby.toLowerCase()} too. How did you get into it?`;
  }
  return `Hi ${name}! I'm also at CUNY. What are you studying?`;
}
