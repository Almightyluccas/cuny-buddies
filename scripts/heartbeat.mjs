// Probes the health endpoint and key pages, appends one JSON line to the log,
// and exits 1 if any probe fails. Run by .github/workflows/heartbeat.yml.
// Usage: node scripts/heartbeat.mjs <baseUrl> <logFile>

import { appendFileSync } from "node:fs";

const [baseUrl, logFile] = process.argv.slice(2);
if (!baseUrl || !logFile) {
  console.error("Usage: node scripts/heartbeat.mjs <baseUrl> <logFile>");
  process.exit(2);
}

// Each page must contain text its own code renders, so a page that returns
// 200 but fails to render (e.g. a streamed server error) counts as down.
const PAGES = [
  { path: "/", expect: "CUNY Buddies" },
  { path: "/matches", expect: "% match" },
  { path: "/me", expect: "Save changes" },
  { path: "/profile/maya-r", expect: "Maya R." },
];
const TIMEOUT_MS = 10_000;

// ms is time to response headers.
async function probe(path, check) {
  const start = performance.now();
  try {
    const res = await fetch(baseUrl + path, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ms = Math.round(performance.now() - start);
    const result = { path, status: res.status, ok: res.ok, ms };
    Object.assign(result, await check(res));
    return result;
  } catch (error) {
    return { path, status: null, ok: false, ms: null, error: error.name };
  }
}

async function checkHealth(res) {
  const body = await res.json().catch(() => ({}));
  return { dbLatencyMs: body.dbLatencyMs ?? null, commit: body.commit ?? null };
}

const checkPage = (expect) => async (res) => {
  const found = (await res.text()).includes(expect);
  return found ? {} : { ok: false, error: `missing "${expect}"` };
};

const results = [await probe("/api/health", checkHealth)];
for (const { path, expect } of PAGES) results.push(await probe(path, checkPage(expect)));

const entry = {
  time: new Date().toISOString(),
  ok: results.every((r) => r.ok),
  results,
};
appendFileSync(logFile, JSON.stringify(entry) + "\n");

const rows = results.map(
  (r) =>
    `| ${r.path} | ${r.status ?? "-"}${r.error ? ` (${r.error})` : ""} | ${r.ms ?? "-"} | ${r.dbLatencyMs ?? "-"} |`,
);
const summary = [
  `### Heartbeat ${entry.ok ? "OK" : "FAILED"} (${entry.time})`,
  "| Path | Status | ms | DB ms |",
  "| --- | --- | --- | --- |",
  ...rows,
].join("\n");
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
}

process.exitCode = entry.ok ? 0 : 1; // not exit(): lets open sockets close
