// Pure calculations for scripts/sprint-metrics.mts.

export interface Stats {
  n: number;
  mean: number;
  median: number;
  p95: number;
  min: number;
  max: number;
}

export function stats(values: (number | null | undefined)[]): Stats | null {
  const v = values
    .filter((x): x is number => Number.isFinite(x))
    .sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = v.length >> 1;
  return {
    n: v.length,
    mean: v.reduce((s, x) => s + x, 0) / v.length,
    median: v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2,
    p95: v[Math.ceil(0.95 * v.length) - 1], // nearest rank
    min: v[0],
    max: v[v.length - 1],
  };
}

const round = (x: number) => Math.round(x * 10) / 10;

export function formatStats(s: Stats | null, unit: string): string {
  if (!s) return "no data";
  const f = (x: number) => `${round(x)}${unit}`;
  return `mean ${f(s.mean)}, median ${f(s.median)}, p95 ${f(s.p95)}, range ${round(s.min)}–${f(s.max)} (n=${s.n})`;
}

export function percent(part: number, whole: number): string {
  return whole ? `${((100 * part) / whole).toFixed(1)}%` : "n/a";
}

// Coverage % from an Octocov PR comment ("| 20.8% | 1s |").
export function octocovCoverage(body: string): number | null {
  const match = body.match(/\|\s*([\d.]+)%\s*\|/);
  return match ? Number(match[1]) : null;
}

export interface CommitStatus {
  state: string; // pending | success | failure | error
  created_at: string;
}

// Each pending → final status pair is one deployment.
export function deployments(statuses: CommitStatus[]) {
  const sorted = [...statuses].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const result: { ok: boolean; seconds: number }[] = [];
  let start: string | null = null;
  for (const s of sorted) {
    if (s.state === "pending") start ??= s.created_at;
    else if (start) {
      result.push({ ok: s.state === "success", seconds: seconds(start, s.created_at) });
      start = null;
    }
  }
  return result;
}

export function seconds(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / 1000;
}

export interface Probe {
  path: string;
  ok: boolean;
  ms: number | null;
  dbLatencyMs?: number | null;
}

export interface Heartbeat {
  time: string;
  ok: boolean;
  results: Probe[];
}

export function summarizeHeartbeats(beats: Heartbeat[]) {
  const probes = beats.flatMap((b) => b.results);
  const paths = [...new Set(probes.map((p) => p.path))];
  return {
    samples: beats.length,
    up: beats.filter((b) => b.ok).length,
    first: beats[0]?.time ?? null,
    last: beats.at(-1)?.time ?? null,
    db: stats(probes.map((p) => p.dbLatencyMs)),
    paths: paths.map((path) => {
      const p = probes.filter((x) => x.path === path);
      return { path, up: p.filter((x) => x.ok).length, total: p.length, ms: stats(p.map((x) => x.ms)) };
    }),
  };
}

export interface Issue {
  created_at: string;
  closed_at: string | null;
}

// Open issues at the end of each UTC day; "planned" = open or created by the
// end of the first day. Ideal falls linearly from planned to 0.
export function burndown(issues: Issue[], since: string, until: string) {
  const dayEnd = (date: string) => Date.parse(`${date}T23:59:59.999Z`);
  const openAt = (t: number) =>
    issues.filter(
      (i) => Date.parse(i.created_at) <= t && !(i.closed_at && Date.parse(i.closed_at) <= t),
    ).length;

  const dates: string[] = [];
  for (let t = dayEnd(since); t <= dayEnd(until); t += 864e5) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  const planned = issues.filter((i) => Date.parse(i.created_at) <= dayEnd(since)).length;
  const inSprint = (t: string | null) =>
    t != null && Date.parse(t) >= Date.parse(`${since}T00:00:00Z`) && Date.parse(t) <= dayEnd(until);

  return {
    planned,
    added: issues.length - planned,
    closed: issues.filter((i) => inSprint(i.closed_at)).length,
    days: dates.map((date, i) => ({
      date,
      open: openAt(dayEnd(date)),
      ideal: round(dates.length > 1 ? planned * (1 - i / (dates.length - 1)) : 0),
    })),
  };
}
