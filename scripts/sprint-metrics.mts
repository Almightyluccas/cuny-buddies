// Sprint report metrics as one Markdown report. Reads GitHub (PRs, reviews,
// workflow runs, Vercel commit statuses, milestone issues) and optional local
// files (coverage summary, Vitest JSON results, heartbeat log).
// Run by .github/workflows/metrics.yml. Locally:
//   GITHUB_TOKEN=$(gh auth token) npm run metrics -- --since 2026-11-10 \
//     --until 2026-11-23 [--milestone "Sprint 3"] [--coverage <file>] \
//     [--tests <file>] [--heartbeat <file>]

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  burndown,
  deployments,
  formatStats,
  octocovCoverage,
  percent,
  seconds,
  stats,
  summarizeHeartbeats,
  type CommitStatus,
  type Heartbeat,
} from "@/lib/metrics";

const { values: args } = parseArgs({
  options: {
    since: { type: "string" },
    until: { type: "string" },
    milestone: { type: "string" },
    coverage: { type: "string" },
    tests: { type: "string" },
    heartbeat: { type: "string" },
    repo: { type: "string" },
  },
});
const repo = args.repo ?? process.env.GITHUB_REPOSITORY ?? "Almightyluccas/cuny-buddies";
const token = process.env.GITHUB_TOKEN;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
if (!args.since || !args.until || !DATE.test(args.since) || !DATE.test(args.until) || !token) {
  console.error("Usage: GITHUB_TOKEN=... npm run metrics -- --since YYYY-MM-DD --until YYYY-MM-DD");
  process.exit(2);
}
const { since: sinceDate, until: untilDate } = args as { since: string; until: string };

// UTC days, inclusive.
const since = Date.parse(`${sinceDate}T00:00:00Z`);
const until = Date.parse(`${untilDate}T23:59:59.999Z`);
const inRange = (t?: string | null) => t != null && Date.parse(t) >= since && Date.parse(t) <= until;

// Minimal shapes of the GitHub REST responses used here.
type User = { login: string; type: string };
type Pull = { number: number; title: string; html_url: string; state: string; created_at: string; updated_at: string; merged_at: string | null; user: User };
type Review = { state: string; submitted_at: string; html_url: string; user: User };
type Run = { id: number; conclusion: string | null; status: string; run_started_at: string; updated_at: string };
type Step = { name: string; conclusion: string | null; started_at: string; completed_at: string };
type Commit = { sha: string; parents: { sha: string }[] };

async function api(path: string) {
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`);
  return res;
}

// Follows pagination; `key` picks the array from wrapped responses.
async function getAll<T>(path: string, key?: string): Promise<T[]> {
  const items: T[] = [];
  let next: string | undefined = `${path}${path.includes("?") ? "&" : "?"}per_page=100`;
  while (next) {
    const res = await api(next);
    const body = await res.json();
    items.push(...(key ? body[key] : body));
    next = res.headers.get("link")?.match(/<https:\/\/api\.github\.com\/([^>]+)>;\s*rel="next"/)?.[1];
  }
  return items;
}

const isBot = (u: User) => u.type === "Bot";
const cell = (s: string) => s.replaceAll("|", "\\|");
const table = (head: string[], rows: (string | number)[][]) => [
  `| ${head.join(" | ")} |`,
  `| ${head.map(() => "---").join(" | ")} |`,
  ...rows.map((r) => `| ${r.join(" | ")} |`),
];

const out = [`# Sprint metrics: ${sinceDate} to ${untilDate} (UTC)`, `Repo: ${repo}`, ""];

// --- vii–ix: code submissions and reviews ---

const allPulls = await getAll<Pull>(`repos/${repo}/pulls?state=all`);
const pulls = allPulls.filter((p) => inRange(p.created_at) && !isBot(p.user));
const reviews: (Review & { pr: number })[] = [];
for (const p of allPulls.filter((p) => Date.parse(p.updated_at) >= since)) {
  for (const r of await getAll<Review>(`repos/${repo}/pulls/${p.number}/reviews`)) {
    if (inRange(r.submitted_at) && !isBot(r.user) && r.state !== "PENDING") reviews.push({ ...r, pr: p.number });
  }
}
const coverageByPr = new Map<number, number | null>();
for (const p of pulls) {
  const comments = await getAll<{ body: string }>(`repos/${repo}/issues/${p.number}/comments`);
  const report = comments.findLast((c) => c.body.includes("<!-- octocov -->"));
  coverageByPr.set(p.number, report ? octocovCoverage(report.body) : null);
}

const merged = (list: Pull[]) => list.filter((p) => p.merged_at).length;
const people = [...new Set([...pulls, ...reviews].map((x) => x.user.login))].sort();
out.push(
  "## Code submissions and reviews (vii–ix)",
  `- PRs opened: **${pulls.length}** (merged ${merged(pulls)}, open ${pulls.filter((p) => p.state === "open").length})`,
  `- Formal reviews submitted: **${reviews.length}** (approve, comment, or request changes, on any PR)`,
  `- Average reviews per PR opened: **${pulls.length ? (reviews.length / pulls.length).toFixed(2) : "n/a"}**`,
  "",
  ...table(
    ["Person", "PRs opened", "PRs merged", "Reviews given"],
    people.map((u) => {
      const own = pulls.filter((p) => p.user.login === u);
      return [u, own.length, merged(own), reviews.filter((r) => r.user.login === u).length];
    }),
  ),
  "",
  ...table(
    ["PR", "Author", "State", "Coverage (Octocov)"],
    pulls.map((p) => [
      `[#${p.number}](${p.html_url}) ${cell(p.title)}`,
      p.user.login,
      p.merged_at ? "merged" : p.state,
      coverageByPr.get(p.number) != null ? `${coverageByPr.get(p.number)}%` : "-",
    ]),
  ),
  "",
  ...table(
    ["Review", "Reviewer", "State"],
    reviews.map((r) => [`[#${r.pr}](${r.html_url})`, r.user.login, r.state.toLowerCase()]),
  ),
  "",
);

// --- x: workflow runs; v, xii: CI build and test steps ---

const workflows = (
  await getAll<{ id: number; name: string; path: string }>(`repos/${repo}/actions/workflows`, "workflows")
).filter((w) => !w.path.endsWith("/heartbeat.yml")); // reported from its log below
const runsByPath = new Map<string, Run[]>();
for (const w of workflows) {
  const runs = await getAll<Run>(
    `repos/${repo}/actions/workflows/${w.id}/runs?created=${sinceDate}..${untilDate}`,
    "workflow_runs",
  );
  runsByPath.set(w.path, runs.filter((r) => r.status === "completed"));
}

out.push(
  "## Workflow runs and errors (x)",
  ...table(
    ["Workflow", "Runs", "Success", "Failure", "Other", "Pass rate"],
    workflows.map((w) => {
      const runs = runsByPath.get(w.path) ?? [];
      const ok = runs.filter((r) => r.conclusion === "success").length;
      const failed = runs.filter((r) => r.conclusion === "failure").length;
      return [w.name, runs.length, ok, failed, runs.length - ok - failed, percent(ok, ok + failed)];
    }),
  ),
  "",
);

const ciRuns = runsByPath.get(".github/workflows/ci.yml") ?? [];
const buildTimes: number[] = [];
const testTimes: number[] = [];
const testOutcomes: string[] = [];
const failedSteps = new Map<string, number>();
for (const run of ciRuns) {
  for (const job of await getAll<{ steps?: Step[] }>(`repos/${repo}/actions/runs/${run.id}/jobs`, "jobs")) {
    for (const step of job.steps ?? []) {
      const time = seconds(step.started_at, step.completed_at);
      if (step.name === "Build" && step.conclusion === "success") buildTimes.push(time);
      if (step.name === "Test with coverage") {
        if (step.conclusion === "success") testTimes.push(time);
        if (step.conclusion === "success" || step.conclusion === "failure") testOutcomes.push(step.conclusion);
      }
      if (step.conclusion === "failure") failedSteps.set(step.name, (failedSteps.get(step.name) ?? 0) + 1);
    }
  }
}
const testPasses = testOutcomes.filter((c) => c === "success").length;
out.push(
  "## CI build and tests (v, x, xii)",
  `- CI runs: ${ciRuns.length}; full run: ${formatStats(stats(ciRuns.map((r) => seconds(r.run_started_at, r.updated_at))), "s")}`,
  `- Build step (\`next build\`): ${formatStats(stats(buildTimes), "s")}`,
  `- Test step: ${formatStats(stats(testTimes), "s")}; passed in ${percent(testPasses, testOutcomes.length)} of ${testOutcomes.length} runs`,
  `- Failures by step: ${[...failedSteps].map(([s, n]) => `${s} ×${n}`).join(", ") || "none"}`,
  "",
);

// --- vi, x: Vercel deployments from commit statuses ---

const branches = await getAll<{ name: string; commit: { sha: string } }>(`repos/${repo}/branches`);
const commits = new Map<string, Commit>();
const window = `since=${new Date(since).toISOString()}&until=${new Date(until).toISOString()}`;
for (const b of branches) {
  for (const c of await getAll<Commit>(`repos/${repo}/commits?sha=${encodeURIComponent(b.name)}&${window}`)) {
    commits.set(c.sha, c);
  }
}
// Production deploys come from main's first-parent history.
const production = new Set<string>();
for (let sha = branches.find((b) => b.name === "main")?.commit.sha; sha && commits.has(sha); ) {
  production.add(sha);
  sha = commits.get(sha)?.parents[0]?.sha;
}
const deploys: { prod: boolean; ok: boolean; seconds: number }[] = [];
for (const sha of commits.keys()) {
  const statuses = await getAll<CommitStatus & { context: string }>(`repos/${repo}/commits/${sha}/statuses`);
  for (const d of deployments(statuses.filter((s) => s.context === "Vercel"))) {
    deploys.push({ prod: production.has(sha), ...d });
  }
}
const okSeconds = (prod: boolean) => deploys.filter((d) => d.prod === prod && d.ok).map((d) => d.seconds);
out.push(
  "## Deployments (vi, x)",
  `- Vercel deployments: ${deploys.length}, succeeded ${percent(deploys.filter((d) => d.ok).length, deploys.length)}`,
  `- Production (main), build to live: ${formatStats(stats(okSeconds(true)), "s")}`,
  `- Previews (branches), build to live: ${formatStats(stats(okSeconds(false)), "s")}`,
  "",
);

// --- ii–iv, xiv: heartbeat log ---

out.push("## Uptime, latency, DB performance (ii, iii, iv, xiv)");
if (args.heartbeat && existsSync(args.heartbeat)) {
  const beats = readFileSync(args.heartbeat, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Heartbeat)
    .filter((b) => inRange(b.time));
  const h = summarizeHeartbeats(beats);
  out.push(
    `- Heartbeats: ${h.samples} (${h.first ?? "-"} to ${h.last ?? "-"}); all probes up: **${percent(h.up, h.samples)}**`,
    `- DB ping via \`/api/health\`: ${formatStats(h.db, "ms")}`,
    "",
    ...table(
      ["Path", "Uptime", "Response time (to headers)"],
      h.paths.map((p) => [p.path, percent(p.up, p.total), formatStats(p.ms, "ms")]),
    ),
    "",
  );
} else {
  out.push("- No heartbeat log provided.", "");
}

// --- i, xii: tests and coverage ---

out.push("## Tests and coverage (i, xii)");
if (args.tests && existsSync(args.tests)) {
  type TestFile = { name: string; assertionResults: { status: string }[] };
  const results = JSON.parse(readFileSync(args.tests, "utf8")) as {
    numTotalTests: number; numPassedTests: number; numFailedTests: number; testResults: TestFile[];
  };
  // Tests under lib/db run against a real (in-memory) MongoDB.
  const isIntegration = (f: TestFile) => /[\\/]lib[\\/]db[\\/]/.test(f.name);
  const tests = (pred: (f: TestFile) => boolean) =>
    results.testResults.filter(pred).flatMap((f) => f.assertionResults);
  const passed = (list: { status: string }[]) => list.filter((t) => t.status === "passed").length;
  const integration = tests(isIntegration);
  const unit = tests((f) => !isIntegration(f));
  out.push(
    `- Tests: ${results.numTotalTests}, passed ${results.numPassedTests}, failed ${results.numFailedTests}`,
    `- Unit: ${unit.length} (passed ${passed(unit)}); integration (MongoDB): ${integration.length} (passed ${passed(integration)})`,
  );
} else {
  out.push("- No test results provided.");
}
if (args.coverage && existsSync(args.coverage)) {
  const { total } = JSON.parse(readFileSync(args.coverage, "utf8"));
  const c = (k: string) => `${total[k].pct}% (${total[k].covered}/${total[k].total})`;
  out.push(`- Coverage: lines ${c("lines")}, statements ${c("statements")}, branches ${c("branches")}, functions ${c("functions")}`);
} else {
  out.push("- No coverage summary provided.");
}
out.push("");

// --- xi: burndown ---

out.push("## Burndown (xi)");
const milestone = args.milestone
  ? (await getAll<{ number: number; title: string }>(`repos/${repo}/milestones?state=all`)).find(
      (m) => m.title === args.milestone,
    )
  : undefined;
if (milestone) {
  const issues = (
    await getAll<{ created_at: string; closed_at: string | null; pull_request?: unknown }>(
      `repos/${repo}/issues?milestone=${milestone.number}&state=all`,
    )
  ).filter((i) => !i.pull_request);
  const b = burndown(issues, sinceDate, untilDate);
  out.push(
    `- Milestone "${milestone.title}": ${issues.length} issues; planned at start ${b.planned}, added later ${b.added}, closed in range ${b.closed}`,
    "",
    ...table(["Day", "Open issues", "Ideal"], b.days.map((d) => [d.date, d.open, d.ideal])),
    "",
  );
} else {
  out.push(args.milestone ? `- Milestone "${args.milestone}" not found.` : "- No milestone given.", "");
}

const report = out.join("\n");
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + "\n");
