"use server";

import { registerUserAccount } from "@/lib/auth/user-profile.service";

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Creates the Prisma User record after Supabase sign-up.
 * Called from the register form right after supabase.auth.signUp() succeeds.
 */
export async function registerUser(data: {
  email: string;
  name: string;
}): Promise<RegisterResult> {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[registerUser] server action received", { email: data.email });
    }

    await registerUserAccount(data);

    if (process.env.NODE_ENV !== "production") {
      console.debug("[registerUser] server action completed", { email: data.email });
    }

    return { success: true };
  } catch (err) {
    console.error("[registerUser]", err);
    return { success: false, error: "Database error. Please try again." };
  }
}
