import "server-only";

import type { CampusId } from "@/lib/campuses";
import { getDb } from "@/lib/db/client";
import { COLLECTIONS } from "@/lib/db/schema";
import type { User } from "@/lib/types";

type UserDoc = Omit<User, "id"> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

function users() {
  return getDb().collection<UserDoc>(COLLECTIONS.users);
}

// Timestamps stay in the DB; callers get the plain profile.
const projection = { createdAt: 0, updatedAt: 0 };

function toUser({ _id, ...profile }: Omit<UserDoc, "createdAt" | "updatedAt">): User {
  return { id: _id, ...profile };
}

export async function getUser(id: string): Promise<User | null> {
  const doc = await users().findOne({ _id: id }, { projection });
  return doc && toUser(doc);
}

// Students on a campus, excluding the viewer.
export async function listUsersByCampus(
  campusId: CampusId,
  excludeId?: string,
): Promise<User[]> {
  const filter = excludeId
    ? { campusId, _id: { $ne: excludeId } }
    : { campusId };
  return (await users().find(filter, { projection }).toArray()).map(toUser);
}

// Creates or replaces the profile. Changing campusId keeps all other data.
export async function saveUser({ id, ...profile }: User): Promise<void> {
  const now = new Date();
  await users().updateOne(
    { _id: id },
    { $set: { ...profile, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
}
