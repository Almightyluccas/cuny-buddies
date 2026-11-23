import { afterEach, describe, expect, it, vi } from "vitest";
import { sentryOptions } from "@/lib/sentry";

afterEach(() => {
  vi.unstubAllEnvs();
});

function stub(env: Record<string, string | undefined>) {
  for (const key of ["NEXT_PUBLIC_SENTRY_DSN", "NEXT_PUBLIC_VERCEL_ENV", "VERCEL_ENV"]) {
    vi.stubEnv(key, env[key]);
  }
}

describe("sentryOptions", () => {
  it("is disabled without a DSN", () => {
    stub({});
    expect(sentryOptions()).toMatchObject({
      dsn: undefined,
      enabled: false,
      environment: "development",
      tracesSampleRate: 1,
    });
  });

  it("tags the Vercel environment and samples 10% of production traces", () => {
    stub({ NEXT_PUBLIC_SENTRY_DSN: "https://k@o1.ingest.sentry.io/2", NEXT_PUBLIC_VERCEL_ENV: "production" });
    expect(sentryOptions()).toMatchObject({ enabled: true, environment: "production", tracesSampleRate: 0.1 });

    stub({ NEXT_PUBLIC_SENTRY_DSN: "https://k@o1.ingest.sentry.io/2", VERCEL_ENV: "preview" });
    expect(sentryOptions()).toMatchObject({ environment: "preview", tracesSampleRate: 1 });
  });

  it("sends no user info, cookies, bodies, or query data", () => {
    stub({});
    expect(sentryOptions().dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      databaseQueryData: false,
      genAI: { inputs: false, outputs: false },
    });
  });
});
