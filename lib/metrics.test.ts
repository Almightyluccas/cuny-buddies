import { describe, expect, it } from "vitest";
import {
  burndown,
  deployments,
  formatStats,
  octocovCoverage,
  percent,
  stats,
  summarizeHeartbeats,
} from "@/lib/metrics";

describe("stats", () => {
  it("computes mean, median, nearest-rank p95, and range, ignoring non-numbers", () => {
    expect(stats([4, null, 1, 3, 2, undefined, NaN])).toEqual({
      n: 4, mean: 2.5, median: 2.5, p95: 4, min: 1, max: 4,
    });
    expect(stats([5, 1, 3])?.median).toBe(3);
    expect(stats([])).toBeNull();
  });

  it("formats stats and percents", () => {
    expect(formatStats(stats([1, 2]), "s")).toBe("mean 1.5s, median 1.5s, p95 2s, range 1–2s (n=2)");
    expect(formatStats(null, "ms")).toBe("no data");
    expect(percent(1, 3)).toBe("33.3%");
    expect(percent(0, 0)).toBe("n/a");
  });
});

describe("octocovCoverage", () => {
  it("reads the coverage cell from an Octocov comment", () => {
    const body = "## Code Metrics Report\n| Coverage | Test Execution Time |\n|---:|---:|\n| 20.8%    | 1s |";
    expect(octocovCoverage(body)).toBe(20.8);
    expect(octocovCoverage("no table")).toBeNull();
  });
});

describe("deployments", () => {
  it("pairs each pending status with the next final one, in time order", () => {
    expect(
      deployments([
        { state: "success", created_at: "2026-11-10T00:00:30Z" },
        { state: "pending", created_at: "2026-11-10T00:00:00Z" },
        { state: "pending", created_at: "2026-11-10T01:00:00Z" },
        { state: "failure", created_at: "2026-11-10T01:00:10Z" },
        { state: "success", created_at: "2026-11-10T02:00:00Z" }, // no pending before it
      ]),
    ).toEqual([
      { ok: true, seconds: 30 },
      { ok: false, seconds: 10 },
    ]);
  });
});

describe("summarizeHeartbeats", () => {
  it("computes uptime per run and per path, and DB latency", () => {
    const s = summarizeHeartbeats([
      {
        time: "t1",
        ok: true,
        results: [
          { path: "/api/health", ok: true, ms: 100, dbLatencyMs: 10 },
          { path: "/", ok: true, ms: 50 },
        ],
      },
      {
        time: "t2",
        ok: false,
        results: [
          { path: "/api/health", ok: false, ms: 300, dbLatencyMs: null },
          { path: "/", ok: true, ms: 70 },
        ],
      },
    ]);
    expect(s).toMatchObject({ samples: 2, up: 1, first: "t1", last: "t2" });
    expect(s.db?.mean).toBe(10);
    expect(s.paths).toEqual([
      { path: "/api/health", up: 1, total: 2, ms: expect.objectContaining({ mean: 200 }) },
      { path: "/", up: 2, total: 2, ms: expect.objectContaining({ mean: 60 }) },
    ]);
  });
});

describe("burndown", () => {
  it("counts open issues per day against a linear ideal", () => {
    const b = burndown(
      [
        { created_at: "2026-11-09T12:00:00Z", closed_at: "2026-11-11T12:00:00Z" },
        { created_at: "2026-11-10T08:00:00Z", closed_at: null },
        { created_at: "2026-11-11T08:00:00Z", closed_at: "2026-11-12T08:00:00Z" }, // added mid-sprint
      ],
      "2026-11-10",
      "2026-11-12",
    );
    expect(b).toMatchObject({ planned: 2, added: 1, closed: 2 });
    expect(b.days).toEqual([
      { date: "2026-11-10", open: 2, ideal: 2 },
      { date: "2026-11-11", open: 2, ideal: 1 },
      { date: "2026-11-12", open: 1, ideal: 0 },
    ]);
  });
});
