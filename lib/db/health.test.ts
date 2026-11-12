import { MongoMemoryServer } from "mongodb-memory-server";
import type { MongoClient } from "mongodb";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { checkHealth } from "@/lib/db/health";

const g = globalThis as unknown as { mongoClient?: MongoClient };
let server: MongoMemoryServer;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
});

afterEach(async () => {
  await g.mongoClient?.close();
  delete g.mongoClient;
  delete process.env.VERCEL_GIT_COMMIT_SHA;
});

afterAll(async () => {
  await server.stop();
});

describe("checkHealth", () => {
  it("is ok with DB latency and the short commit when the DB answers", async () => {
    process.env.MONGODB_URI = server.getUri();
    process.env.VERCEL_GIT_COMMIT_SHA = "abc1234def5678";

    const health = await checkHealth();

    expect(health.status).toBe("ok");
    expect(health.dbLatencyMs).toBeGreaterThanOrEqual(0);
    expect(health.commit).toBe("abc1234");
  });

  it("is degraded when the DB is unreachable", async () => {
    process.env.MONGODB_URI = "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=500";

    expect(await checkHealth()).toEqual({
      status: "degraded",
      dbLatencyMs: null,
      commit: null,
    });
  });

  it("is degraded when MONGODB_URI is missing", async () => {
    delete process.env.MONGODB_URI;

    expect((await checkHealth()).status).toBe("degraded");
  });
});
