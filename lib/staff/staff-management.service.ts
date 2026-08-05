import { prisma } from "@/lib/prisma/client";

export async function createStaffMemberRecord(input: {
  name: string;
  email: string;
  organizationId: string;
  createdById: string;
}) {
  const dbUser = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      role: "STAFF",
      organizationId: input.organizationId
    },
    create: {
      name: input.name,
      email: input.email,
      role: "STAFF",
      organizationId: input.organizationId
    }
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: dbUser.id
      }
    },
    update: { role: "reviewer" },
    create: {
      organizationId: input.organizationId,
      userId: dbUser.id,
      role: "reviewer"
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: input.createdById,
      entity: "OrganizationMember",
      action: "created_staff_member",
      meta: { organizationId: input.organizationId, email: input.email }
    }
  });

  return dbUser;
}
