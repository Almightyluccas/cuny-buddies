// Probes the health endpoint and key pages, appends one JSON line to the log,
// and exits 1 if any probe fails. Run by .github/workflows/heartbeat.yml.
// Usage: node scripts/heartbeat.mjs <baseUrl> <logFile>

import { appendFileSync } from "node:fs";

const [baseUrl, logFile] = process.argv.slice(2);
if (!baseUrl || !logFile) {
  console.error("Usage: node scripts/heartbeat.mjs <baseUrl> <logFile>");
  process.exit(2);
}

// Public pages must contain text their own code renders, so a page that
// returns 200 but fails to render (e.g. a streamed server error) counts as down.
const PAGES = [{ path: "/", expect: "Find your people between classes" }];
// App pages require sign-in: a signed-out probe must be redirected to WorkOS
// (and must not get the page itself).
const PROTECTED = ["/matches", "/me", "/my-week", "/profile/maya-r"];
const SIGN_IN = "https://api.workos.com/user_management/authorize";
const TIMEOUT_MS = 10_000;

// ms is time to response headers.
async function probe(path, check, redirect = "follow") {
  const start = performance.now();
  try {
    const res = await fetch(baseUrl + path, {
      cache: "no-store",
      redirect,
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

const checkSignInRedirect = async (res) => {
  const location = res.headers.get("location") ?? "";
  const redirected = res.status >= 300 && res.status < 400 && location.startsWith(SIGN_IN);
  return redirected ? { ok: true } : { ok: false, error: "no sign-in redirect" };
};

const results = [await probe("/api/health", checkHealth)];
for (const { path, expect } of PAGES) results.push(await probe(path, checkPage(expect)));
for (const path of PROTECTED) results.push(await probe(path, checkSignInRedirect, "manual"));

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
