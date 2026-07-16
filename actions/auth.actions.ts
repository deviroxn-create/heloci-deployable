"use server";

import { prisma } from "@/lib/prisma/client";
import { notificationService } from "@/lib/notifications/notification.service";
import { queueTelegramAlert } from "@/lib/telegram/alert-service";

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
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { name: data.name },
      create: {
        email: data.email,
        name: data.name,
        role: "APPLICANT"
      }
    });

    await notificationService.notify("user_registration", {
      userId: user.id,
      userEmail: user.email,
      recipientEmail: user.email,
      name: user.name || data.name
    });

    try {
      await queueTelegramAlert({ type: 'user_created', level: 'INFO', organizationId: user.organizationId ?? undefined, data: { name: user.name || data.name, role: user.role, orgName: user.organizationId } });
    } catch (e) {
      console.error('auth.actions: queueTelegramAlert failed', e);
    }

    return { success: true };
  } catch (err) {
    console.error("[registerUser]", err);
    return { success: false, error: "Database error. Please try again." };
  }
}
