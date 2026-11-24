// Shared options for the browser, server, and edge Sentry SDKs. Sentry stays
// off unless NEXT_PUBLIC_SENTRY_DSN is set (the Vercel integration sets it).

// Header and query keys that carry IP addresses or user identity.
const identityKeys = { deny: ["forwarded", "-ip", "remote-", "via", "-user"] };

export function sentryOptions() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment =
    process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? "development";

  return {
    dsn,
    enabled: Boolean(dsn),
    environment,
    tracesSampleRate: environment === "production" ? 0.1 : 1,
    // SDK v11 collects everything by default; keep student data out of Sentry.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: identityKeys, response: identityKeys },
      httpBodies: [],
      urlQueryParams: identityKeys,
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      graphQL: { document: false, variables: false },
    },
  };
}
