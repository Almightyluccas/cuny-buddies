// Applies collections, validators, and indexes. Run: npm run db:setup

import { MongoClient } from "mongodb";
import { DB_NAME, ensureSchema } from "@/lib/db/schema";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set (add it to .env.local)");

const client = new MongoClient(uri);
try {
  await ensureSchema(client.db(DB_NAME));
  console.log(`Schema applied to "${DB_NAME}".`);
} finally {
  await client.close();
}
