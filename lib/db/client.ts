import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { MongoClient, type Db } from "mongodb";
import { DB_NAME } from "@/lib/db/schema";

// One client per process; globalThis keeps it across dev hot reloads.
const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };

function getClient(): MongoClient {
  if (globalForMongo.mongoClient) return globalForMongo.mongoClient;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  // maxIdleTimeMS lets attachDatabasePool release idle connections on Vercel.
  const client = new MongoClient(uri, {
    appName: "cuny-buddies",
    maxIdleTimeMS: 5000,
  });
  attachDatabasePool(client);
  globalForMongo.mongoClient = client;
  return client;
}

export function getDb(): Db {
  return getClient().db(DB_NAME);
}
