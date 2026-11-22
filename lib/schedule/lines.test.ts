import { describe, expect, it } from "vitest";
import { detectDevice } from "@/lib/schedule/device";
import { itemsToLines, type TextItem } from "@/lib/schedule/lines";

const item = (str: string, x: number, y: number, width = str.length * 5): TextItem => ({
  str,
  x,
  y,
  width,
  height: 10,
});

describe("itemsToLines", () => {
  it("orders lines top to bottom and joins pieces left to right", () => {
    expect(
      itemsToLines([[item("Mon : 4:00 PM to 5:50 PM", 45, 600), item("General Chemistry I", 45, 612)]]),
    ).toEqual(["General Chemistry I", "Mon : 4:00 PM to 5:50 PM"]);
  });

  it("joins a split first letter without a space, and spaced words with one", () => {
    expect(itemsToLines([[item("C", 45, 700, 7), item("HEM 10301", 52, 700), item("2026 Fall Term", 430, 701)]])).toEqual([
      "CHEM 10301 2026 Fall Term",
    ]);
  });

  it("keeps pages in order and skips empty items", () => {
    expect(itemsToLines([[item("page one", 10, 100)], [item(" ", 10, 700), item("page two", 10, 700)]])).toEqual([
      "page one",
      "page two",
    ]);
  });
});

describe("detectDevice", () => {
  it("uses client hints when present, else the user agent", () => {
    expect(detectDevice({ userAgent: "x", userAgentData: { mobile: true } }).type).toBe("mobile");
    expect(detectDevice({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" }).type).toBe("mobile");
    expect(detectDevice({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }).type).toBe("desktop");
  });
});
