import { describe, expect, it, vi } from "vitest";

// authkitProxy runs at import time; return its options so we can assert on them.
vi.mock("@workos-inc/authkit-nextjs", () => ({
  authkitProxy: (options: unknown) => options,
}));

import proxy, { config } from "@/proxy";

const SCHEDULE_PATH = "/api/schedule/:path*";

// The schedule API calls withAuth(), which throws unless the request is covered
// by this proxy. The API route tests mock lib/auth, so only this guards it.
describe("authkit proxy coverage for the schedule API", () => {
  it("includes the schedule API in the matcher", () => {
    expect(config.matcher).toContain(SCHEDULE_PATH);
  });

  it("marks the schedule API unauthenticated so it returns its own 401", () => {
    const { middlewareAuth } = proxy as unknown as { middlewareAuth: { unauthenticatedPaths: string[] } };
    expect(middlewareAuth.unauthenticatedPaths).toContain(SCHEDULE_PATH);
  });
});
