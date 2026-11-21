import { handleAuth } from "@workos-inc/authkit-nextjs";
import { upsertUserAccount } from "@/lib/db/users";

export const GET = handleAuth({
  onSuccess: async ({ user }) => {
    await upsertUserAccount({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  },
});
