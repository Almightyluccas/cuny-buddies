import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSignInUrl: vi.fn(),
  getSignUpUrl: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  getSignInUrl: mocks.getSignInUrl,
  getSignUpUrl: mocks.getSignUpUrl,
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { GET as signIn } from "@/app/auth/sign-in/route";
import { GET as signUp } from "@/app/auth/sign-up/route";

describe("WorkOS authentication entry routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends sign-in directly to WorkOS and returns to matches", async () => {
    mocks.getSignInUrl.mockResolvedValue("https://auth.workos.test/sign-in");

    await expect(signIn()).rejects.toThrow(
      "redirect:https://auth.workos.test/sign-in",
    );

    expect(mocks.getSignInUrl).toHaveBeenCalledWith({ returnTo: "/matches" });
  });

  it("sends sign-up directly to WorkOS and returns to onboarding", async () => {
    mocks.getSignUpUrl.mockResolvedValue("https://auth.workos.test/sign-up");

    await expect(signUp()).rejects.toThrow(
      "redirect:https://auth.workos.test/sign-up",
    );

    expect(mocks.getSignUpUrl).toHaveBeenCalledWith({ returnTo: "/welcome" });
  });
});
