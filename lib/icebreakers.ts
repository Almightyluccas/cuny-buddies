// Suggested first messages. User research (docs/) found that "nobody wants to
// go first", so the app offers an opener built from what two students share.

import { formatTime } from "@/lib/schedule/free-time";
import type { Block } from "@/lib/schedule/model";

export type SharedContext = {
  fromName: string; // the student sending the message
  toName: string; // the classmate receiving it
  sharedClasses?: string[];
  sharedFreeBlocks?: Block[];
  sharedHobbies?: string[];
};

const ACTIVITIES = ["grab coffee", "study together", "get lunch"] as const;

export function formatBlock(block: Block): string {
  return `${block.day} ${formatTime(block.start)}–${formatTime(block.end)}`;
}

// Seeded from both names, so the same pair always gets the same activity and
// the suggestion doesn't change every time the screen renders.
export function pickActivity(fromName: string, toName: string): string {
  let sum = 0;
  for (const ch of `${fromName}|${toName}`) sum += ch.charCodeAt(0);
  return ACTIVITIES[sum % ACTIVITIES.length];
}

export function suggestIcebreaker(ctx: SharedContext): string {
  const name = ctx.toName.trim() || "there";
  const course = ctx.sharedClasses?.[0];
  const block = ctx.sharedFreeBlocks?.[0];
  const hobby = ctx.sharedHobbies?.[0];
  const activity = pickActivity(ctx.fromName.trim(), name);

  if (course && block) {
    return `Hi ${name}! We're both in ${course} and free ${formatBlock(block)}. Want to ${activity}?`;
  }
  if (course) {
    return `Hi ${name}! We're both in ${course}. Want to ${activity} sometime this week?`;
  }
  if (block && hobby) {
    return `Hi ${name}! We both like ${hobby} and we're free ${formatBlock(block)}. Want to meet up?`;
  }
  if (block) {
    return `Hi ${name}! We're both free ${formatBlock(block)}. Want to ${activity}?`;
  }
  if (hobby) {
    return `Hi ${name}! I saw you're into ${hobby} too. How did you get into it?`;
  }
  return `Hi ${name}! I'm also at CUNY. What are you studying?`;
}
