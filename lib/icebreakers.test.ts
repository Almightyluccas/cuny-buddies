import { describe, expect, it } from "vitest";
import {
  formatBlock,
  pickActivity,
  suggestIcebreaker,
} from "@/lib/icebreakers";

const block = { day: "Tue", start: "11:00", end: "12:00" };

describe("icebreakers", () => {
  it("formats a free block", () => {
    expect(formatBlock(block)).toBe("Tue 11:00–12:00");
  });

  it("picks the same activity for the same seed", () => {
    expect(pickActivity("Maya")).toBe(pickActivity("Maya"));
    expect(["grab coffee", "study together", "get lunch"]).toContain(
      pickActivity("Devin"),
    );
  });

  it("uses a shared class and free block together", () => {
    const msg = suggestIcebreaker({
      firstName: "Maya",
      sharedClasses: ["Operating Systems"],
      sharedFreeBlocks: [block],
    });
    expect(msg).toMatch(/^Hi Maya! We're both in Operating Systems and free Tue 11:00–12:00\. Want to /);
  });

  it("falls back to a shared class only", () => {
    expect(
      suggestIcebreaker({ firstName: "Devin", sharedClasses: ["Databases"] }),
    ).toContain("We're both in Databases.");
  });

  it("uses a free block with a shared hobby", () => {
    expect(
      suggestIcebreaker({
        firstName: "Aisha",
        sharedFreeBlocks: [block],
        sharedHobbies: ["Basketball"],
      }),
    ).toBe(
      "Hi Aisha! We both like basketball and we're free Tue 11:00–12:00. Want to meet up?",
    );
  });

  it("uses a free block alone", () => {
    expect(
      suggestIcebreaker({ firstName: "Sam", sharedFreeBlocks: [block] }),
    ).toContain("We're both free Tue 11:00–12:00.");
  });

  it("uses a hobby alone", () => {
    expect(
      suggestIcebreaker({ firstName: "Lee", sharedHobbies: ["Chess"] }),
    ).toBe("Hi Lee! I saw you're into chess too. How did you get into it?");
  });

  it("has a generic opener when nothing is shared", () => {
    expect(suggestIcebreaker({ firstName: "  " })).toBe(
      "Hi there! I'm also at CUNY. What are you studying?",
    );
  });
});
