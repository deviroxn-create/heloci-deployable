import { prisma } from "@/lib/prisma/client";

export async function requireOrgRole(userId: string, organizationId: string, roles: string[]) {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } }
  });
  if (!member || !roles.includes(member.role)) {
    throw new Error("Unauthorized");
  }
  return member;
}

export async function getUserOrganizations(userId: string) {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true }
  });
}
