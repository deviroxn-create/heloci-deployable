import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export async function registerUserAccount(data: { email: string; name: string }) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[registerUserAccount] creating or updating user", { email: data.email, name: data.name });
  }

  let user;
  let isNewUser = false;

  try {
    user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: "APPLICANT"
      }
    });

    isNewUser = true;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      user = await prisma.user.update({
        where: { email: data.email },
        data: { name: data.name }
      });
    } else {
      throw error;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[registerUserAccount] user persistence completed", {
      userId: (user as any).id,
      email: (user as any).email,
      isNewUser
    });
  }

  if (isNewUser) {
    publishDomainEvent("user.registration", {
      userId: (user as any).id,
      email: (user as any).email,
      name: (user as any).name || data.name,
    });
  }

  return user;
}
