import { describe, expect, it } from "vitest";
import {
  CAMPUSES,
  CAMPUS_IDS,
  campusName,
  getCampus,
  isCampusId,
} from "@/lib/campuses";

describe("campuses", () => {
  it("lists all 26 CUNY campuses with unique ids and names", () => {
    expect(CAMPUSES).toHaveLength(26);
    expect(new Set(CAMPUS_IDS).size).toBe(26);
    expect(new Set(CAMPUSES.map((c) => c.name)).size).toBe(26);
  });

  it("validates campus ids", () => {
    expect(isCampusId("ccny")).toBe(true);
    expect(isCampusId("City College")).toBe(false);
    expect(isCampusId(undefined)).toBe(false);
  });

  it("looks up a campus by id", () => {
    expect(getCampus("hunter")).toEqual({
      id: "hunter",
      name: "Hunter College",
      borough: "Manhattan",
    });
    expect(getCampus("nyu")).toBeUndefined();
    expect(getCampus(undefined)).toBeUndefined();
  });

  it("names a campus without throwing when it is missing or unknown", () => {
    expect(campusName("ccny")).toBe("The City College of New York");
    expect(campusName(undefined)).toBe("Campus not set");
    expect(campusName("nyu")).toBe("Campus not set");
  });
});
