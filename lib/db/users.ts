import "server-only";

import { isCampusId, type CampusId } from "@/lib/campuses";
import { getDb } from "@/lib/db/client";
import { COLLECTIONS } from "@/lib/db/schema";
import type { User } from "@/lib/types";

type UserDoc = Partial<Omit<User, "id">> & {
  _id: string;
  email?: string;
  onboardingCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function users() {
  return getDb().collection<UserDoc>(COLLECTIONS.users);
}

// Account-only fields and timestamps stay in the DB; app pages get the profile.
const projection = {
  email: 0,
  createdAt: 0,
  updatedAt: 0,
};

function hasCompleteProfile(doc: UserDoc): doc is UserDoc & Omit<User, "id"> {
  return (
    (doc.onboardingCompleted === true || doc.onboardingCompleted === undefined) &&
    typeof doc.firstName === "string" &&
    typeof doc.lastName === "string" &&
    typeof doc.showLastInitialOnly === "boolean" &&
    typeof doc.age === "number" &&
    (doc.gender === "male" || doc.gender === "female") &&
    typeof doc.showGender === "boolean" &&
    isCampusId(doc.campusId) &&
    typeof doc.majors !== "undefined" &&
    Array.isArray(doc.majors) &&
    typeof doc.year === "string" &&
    Array.isArray(doc.hobbies) &&
    Array.isArray(doc.clubs) &&
    Array.isArray(doc.lookingFor) &&
    Array.isArray(doc.socials)
  );
}

function toUser(doc: UserDoc & Omit<User, "id">): User {
  const {
    _id,
    onboardingCompleted: _onboardingCompleted,
    ...profile
  } = doc;
  return { id: _id, ...profile };
}

export async function getUser(id: string): Promise<User | null> {
  const doc = await users().findOne({ _id: id }, { projection });
  return doc && hasCompleteProfile(doc) ? toUser(doc) : null;
}

// Students on a campus, excluding the viewer.
export async function listUsersByCampus(
  campusId: CampusId,
  excludeId?: string,
): Promise<User[]> {
  const filter = {
    campusId,
    onboardingCompleted: { $ne: false },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  };
  return (await users().find(filter, { projection }).toArray())
    .filter(hasCompleteProfile)
    .map(toUser);
}

// Creates the WorkOS-linked record at login. Profile fields are added to this
// same document when onboarding is complete.
export async function upsertUserAccount(account: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}): Promise<void> {
  const email = account.email.trim();
  if (!email) throw new Error("WorkOS must provide an email for this account.");

  const now = new Date();
  const existing = await users().findOne({ _id: account.id });
  if (existing) {
    const onboardingCompleted =
      existing.onboardingCompleted ?? hasCompleteProfile(existing);
    await users().updateOne(
      { _id: account.id },
      {
        $set: {
          email,
          onboardingCompleted,
          updatedAt: now,
        },
      },
    );
    return;
  }

  const firstName = account.firstName?.trim() ?? "";
  const lastName = account.lastName?.trim() ?? "";
  await users().updateOne(
    { _id: account.id },
    {
      $set: { email, updatedAt: now },
      $setOnInsert: {
        firstName,
        lastName,
        onboardingCompleted: false,
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

// Updates the existing WorkOS-linked record with the completed app profile.
export async function saveUser({ id, ...profile }: User): Promise<void> {
  const now = new Date();
  const result = await users().updateOne(
    { _id: id },
    {
      $set: {
        ...profile,
        onboardingCompleted: true,
        updatedAt: now,
      },
    },
  );
  if (result.matchedCount === 0) {
    throw new Error("Cannot save a profile without its WorkOS account record.");
  }
}
