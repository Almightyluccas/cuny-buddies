import { MongoMemoryServer } from "mongodb-memory-server";
import type { MongoClient } from "mongodb";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { COLLECTIONS, ensureSchema, usersValidator } from "@/lib/db/schema";
import { getUser, listUsersByCampus, saveUser } from "@/lib/db/users";
import type { User } from "@/lib/types";

let server: MongoMemoryServer;

const base: Omit<User, "id" | "campusId"> = {
  firstName: "Maya",
  lastName: "Rivera",
  showLastInitialOnly: true,
  age: 20,
  gender: "female",
  showGender: false,
  majors: ["Computer Science"],
  year: "Junior",
  hobbies: ["Chess"],
  clubs: ["ACM"],
  lookingFor: ["Friends"],
  socials: [{ label: "Instagram", url: "https://instagram.com/" }],
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
  await getDb().collection(COLLECTIONS.users).deleteMany({});
});

describe("users", () => {
  it("round-trips a profile without DB-only fields", async () => {
    const user: User = { id: "u1", campusId: "ccny", ...base };
    await saveUser(user);
    expect(await getUser("u1")).toEqual(user);
    expect(await getUser("missing")).toBeNull();
  });

  it("lists students on a campus, excluding the viewer", async () => {
    await saveUser({ id: "a", campusId: "ccny", ...base });
    await saveUser({ id: "b", campusId: "ccny", ...base });
    await saveUser({ id: "c", campusId: "hunter", ...base });

    const ids = (await listUsersByCampus("ccny", "a")).map((u) => u.id);
    expect(ids).toEqual(["b"]);
    expect(await listUsersByCampus("hunter")).toHaveLength(1);
  });

  it("keeps profile data and createdAt when the campus changes", async () => {
    await saveUser({ id: "u1", campusId: "ccny", ...base });
    const col = getDb().collection(COLLECTIONS.users);
    const before = await col.findOne({ _id: "u1" as never });

    await saveUser({ id: "u1", campusId: "qc", ...base });
    const after = await col.findOne({ _id: "u1" as never });

    expect(after?.campusId).toBe("qc");
    expect(after?.hobbies).toEqual(base.hobbies);
    expect(after?.createdAt).toEqual(before?.createdAt);
    expect(after?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      before?.updatedAt.getTime(),
    );
  });

  it("rejects a profile without a campus at the DB level", async () => {
    const noCampus = { id: "u1", ...base } as User; // base has no campusId
    await expect(saveUser(noCampus)).rejects.toThrow(/validation/i);
    expect(await getUser("u1")).toBeNull();
  });

  it("rejects a sign-in-only doc with no profile fields", async () => {
    const now = new Date();
    await expect(
      getDb()
        .collection(COLLECTIONS.users)
        .insertOne({ _id: "u2" as never, createdAt: now, updatedAt: now }),
    ).rejects.toThrow(/validation/i);
  });

  it("rejects an unknown campus at the DB level", async () => {
    await expect(
      saveUser({ id: "u1", ...base, campusId: "nyu" as never }),
    ).rejects.toThrow(/validation/i);
  });

  it("applies the schema idempotently with a campus index", async () => {
    await ensureSchema(getDb());
    const indexes = await getDb().collection(COLLECTIONS.users).indexes();
    expect(indexes.some((i) => i.key.campusId === 1)).toBe(true);
  });

  it("skips collMod when the validator is unchanged, restores it when not", async () => {
    const db = getDb();
    const calls: string[] = [];
    const command = db.command.bind(db);
    db.command = ((cmd: Record<string, unknown>) => {
      calls.push(Object.keys(cmd)[0]);
      return command(cmd);
    }) as typeof db.command;

    await ensureSchema(db);
    expect(calls).not.toContain("collMod");

    await command({ collMod: COLLECTIONS.users, validator: {} });
    await ensureSchema(db);
    expect(calls).toContain("collMod");
    db.command = command;

    const [info] = await db
      .listCollections({ name: COLLECTIONS.users }, { nameOnly: false })
      .toArray();
    expect(info.options?.validator).toEqual(usersValidator);
  });
});
