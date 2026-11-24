import { MongoMemoryServer } from "mongodb-memory-server";
import type { MongoClient } from "mongodb";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/auth/callback/route";
import { getDb } from "@/lib/db/client";
import { COLLECTIONS, ensureSchema } from "@/lib/db/schema";
import { getUser, saveUser } from "@/lib/db/users";
import type { User } from "@/lib/types";

const workos = vi.hoisted(() => ({
  user: null as null | {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  },
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  handleAuth: (options: {
    onSuccess?: (data: { user: NonNullable<typeof workos.user> }) => Promise<void>;
  }) =>
    async () => {
      if (!workos.user) {
        return new Response("Missing WorkOS test user", { status: 500 });
      }
      await options.onSuccess?.({ user: workos.user });
      return new Response(null, { status: 302 });
    },
}));

let server: MongoMemoryServer;

const profile: Omit<User, "id"> = {
  firstName: "Maya",
  lastName: "Rivera",
  showLastInitialOnly: true,
  age: 20,
  gender: "female",
  showGender: false,
  campusId: "ccny",
  majors: ["Computer Science"],
  year: "Junior",
  hobbies: ["Chess"],
  clubs: ["ACM"],
  lookingFor: ["Friends"],
  socials: [{ label: "Instagram", url: "https://instagram.com/maya" }],
  unavailableSlots: ["Mon-40"],
};

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri();
  await ensureSchema(getDb());
});

afterAll(async () => {
  await (globalThis as unknown as { mongoClient: MongoClient }).mongoClient.close();
  await server.stop();
});

beforeEach(async () => {
  workos.user = {
    id: "workos_user_123",
    email: "maya@cuny.test",
    firstName: "Maya",
    lastName: "Rivera",
  };
  await getDb().collection(COLLECTIONS.users).deleteMany({});
});

describe("WorkOS callback and MongoDB account lifecycle", () => {
  it("creates one incomplete account at login and completes that same record", async () => {
    const response = await GET(
      new NextRequest("http://localhost/auth/callback"),
    );
    expect(response.status).toBe(302);

    const collection = getDb().collection<{
      _id: string;
      [key: string]: unknown;
    }>(COLLECTIONS.users);
    const account = await collection.findOne({ _id: "workos_user_123" });
    expect(account).toMatchObject({
      _id: "workos_user_123",
      email: "maya@cuny.test",
      firstName: "Maya",
      lastName: "Rivera",
      onboardingCompleted: false,
    });
    expect(account?.campusId).toBeUndefined();
    expect(await collection.countDocuments()).toBe(1);
    expect(await getUser("workos_user_123")).toBeNull();

    await saveUser({ id: "workos_user_123", ...profile });

    const completed = await collection.findOne({ _id: "workos_user_123" });
    expect(completed).toMatchObject({
      _id: "workos_user_123",
      email: "maya@cuny.test",
      onboardingCompleted: true,
      campusId: "ccny",
      hobbies: ["Chess"],
    });
    expect(await collection.countDocuments()).toBe(1);
    expect(await getUser("workos_user_123")).toEqual({
      id: "workos_user_123",
      ...profile,
    });

    workos.user = {
      id: "workos_user_123",
      email: "maya.updated@cuny.test",
      firstName: "Different WorkOS name",
      lastName: "Ignored after profile setup",
    };
    await GET(new NextRequest("http://localhost/auth/callback"));

    const afterReturningLogin = await collection.findOne({
      _id: "workos_user_123",
    });
    expect(await collection.countDocuments()).toBe(1);
    expect(afterReturningLogin).toMatchObject({
      email: "maya.updated@cuny.test",
      firstName: "Maya",
      lastName: "Rivera",
      onboardingCompleted: true,
      campusId: "ccny",
    });
  });
});
