// Collection names, validators, and indexes. Applied by `npm run db:setup`.
// Kept free of `server-only` so the setup script and tests can import it.

import { isDeepStrictEqual } from "node:util";
import type { Db } from "mongodb";
import { CAMPUS_IDS } from "@/lib/campuses";

export const DB_NAME = "cuny-buddies";

export const COLLECTIONS = { users: "users" } as const;

const stringArray = { bsonType: "array", items: { bsonType: "string" } };

// A user doc is written only when onboarding completes (sign-in writes
// nothing), so every profile field, including campusId, is required.
export const usersValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "firstName",
      "lastName",
      "showLastInitialOnly",
      "age",
      "gender",
      "showGender",
      "campusId",
      "majors",
      "year",
      "hobbies",
      "clubs",
      "lookingFor",
      "socials",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      _id: { bsonType: "string" }, // auth provider user id
      firstName: { bsonType: "string" },
      lastName: { bsonType: "string" },
      showLastInitialOnly: { bsonType: "bool" },
      age: { bsonType: "number", minimum: 0 },
      gender: { enum: ["male", "female"] },
      showGender: { bsonType: "bool" },
      campusId: { enum: CAMPUS_IDS },
      majors: stringArray,
      year: { bsonType: "string" },
      hobbies: stringArray,
      clubs: stringArray,
      lookingFor: stringArray,
      socials: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["label", "url"],
          properties: {
            label: { bsonType: "string" },
            url: { bsonType: "string" },
          },
        },
      },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

// Idempotent: creates missing collections, updates validators, ensures indexes.
export async function ensureSchema(db: Db) {
  const [users] = await db
    .listCollections({ name: COLLECTIONS.users }, { nameOnly: false })
    .toArray();

  if (!users) {
    await db.createCollection(COLLECTIONS.users, { validator: usersValidator });
  } else if (!isDeepStrictEqual(users.options?.validator, usersValidator)) {
    // collMod needs the dbAdmin role; readWrite users can only create.
    await db.command({ collMod: COLLECTIONS.users, validator: usersValidator });
  }

  // Campus is the primary filter for listing and matching.
  await db.collection(COLLECTIONS.users).createIndex({ campusId: 1 });
}
