import "server-only";

import { withAuth } from "@workos-inc/authkit-nextjs";

// The signed-in user's WorkOS id, or null. This is the id the callback stores
// as the user's `_id` and the key schedules are saved under.
export async function currentUserId(): Promise<string | null> {
  const { user } = await withAuth();
  return user?.id ?? null;
}
