import "server-only";

// The signed-in user's id, or null. Always null until WorkOS login is merged;
// then this reads the WorkOS session.
export async function currentUserId(): Promise<string | null> {
  return null;
}
