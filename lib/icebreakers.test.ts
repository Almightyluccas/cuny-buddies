import { describe, expect, it } from "vitest";
import {
  formatBlock,
  pickActivity,
  suggestIcebreaker,
} from "@/lib/icebreakers";
import type { Block } from "@/lib/schedule/model";

const block: Block = { day: "Tue", start: 11 * 60, end: 12 * 60 };

describe("icebreakers", () => {
  it("formats a free block with AM/PM times", () => {
    expect(formatBlock(block)).toBe("Tue 11:00 AM–12:00 PM");
  });

  it("picks the same activity for the same pair", () => {
    expect(pickActivity("Daniil", "Maya")).toBe(pickActivity("Daniil", "Maya"));
    expect(["grab coffee", "study together", "get lunch"]).toContain(
      pickActivity("Daniil", "Devin"),
    );
  });

  it("seeds from both names, not just the recipient", () => {
    const activities = new Set(
      ["Ron", "Rajiv", "Luccas", "Rasul", "Daniil"].map((from) =>
        pickActivity(from, "Maya"),
      ),
    );
    expect(activities.size).toBeGreaterThan(1);
  });

  it("uses a shared class and free block together", () => {
    const msg = suggestIcebreaker({
      fromName: "Daniil",
      toName: "Maya",
      sharedClasses: ["Operating Systems"],
      sharedFreeBlocks: [block],
    });
    expect(msg).toMatch(
      /^Hi Maya! We're both in Operating Systems and free Tue 11:00 AM–12:00 PM\. Want to /,
    );
  });

  it("falls back to a shared class only", () => {
    const msg = suggestIcebreaker({
      fromName: "Daniil",
      toName: "Devin",
      sharedClasses: ["Databases"],
    });
    expect(msg).toContain("We're both in Databases.");
    expect(msg).toContain("sometime this week?");
  });

  it("uses a free block with a shared hobby, keeping its capitalization", () => {
    expect(
      suggestIcebreaker({
        fromName: "Daniil",
        toName: "Aisha",
        sharedFreeBlocks: [block],
        sharedHobbies: ["League of Legends"],
      }),
    ).toBe(
      "Hi Aisha! We both like League of Legends and we're free Tue 11:00 AM–12:00 PM. Want to meet up?",
    );
  });

  it("uses a free block alone", () => {
    expect(
      suggestIcebreaker({
        fromName: "Daniil",
        toName: "Sam",
        sharedFreeBlocks: [block],
      }),
    ).toContain("We're both free Tue 11:00 AM–12:00 PM.");
  });

  it("uses a hobby alone", () => {
    expect(
      suggestIcebreaker({
        fromName: "Daniil",
        toName: "Lee",
        sharedHobbies: ["Chess"],
      }),
    ).toBe("Hi Lee! I saw you're into Chess too. How did you get into it?");
  });

  it("has a generic opener when nothing is shared", () => {
    expect(suggestIcebreaker({ fromName: "Daniil", toName: "  " })).toBe(
      "Hi there! I'm also at CUNY. What are you studying?",
    );
  });
});
