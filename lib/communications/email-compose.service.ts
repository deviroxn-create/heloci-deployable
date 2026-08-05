import { prisma } from "@/lib/prisma/client";

export async function getSenderIdentityForCompose(senderId: string, organizationId: string) {
  return prisma.senderIdentity.findFirst({
    where: {
      id: senderId,
      organizationId,
    },
  });
}
