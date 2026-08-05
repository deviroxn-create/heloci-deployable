import { prisma } from "@/lib/prisma/client";

export async function getOrganizationMembership(organizationId: string, userId: string) {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  });
}

export async function findOrganizationMembersForSearch(organizationId: string, query: string, limit: number, departmentId?: string, excludeUserId?: string) {
  return prisma.organizationMember.findMany({
    where: {
      organizationId,
      user: {
        ...(excludeUserId && { NOT: { id: excludeUserId } }),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { jobTitle: { contains: query, mode: "insensitive" } },
          { department: { name: { contains: query, mode: "insensitive" } } },
        ],
        ...(departmentId && { departmentId }),
      },
    },
    include: {
      user: {
        include: {
          department: true,
        },
      },
    },
    take: limit,
  });
}

export async function findApplicantsForSearch(organizationId: string, query: string, limit: number, excludeUserId?: string) {
  return prisma.user.findMany({
    where: {
      role: "APPLICANT",
      ...(excludeUserId && { NOT: { id: excludeUserId } }),
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
      programApplications: {
        some: {
          program: { organizationId },
        },
      },
    },
    take: limit,
  });
}

export async function findDepartmentsForSearch(organizationId: string, query: string, limit: number) {
  return prisma.department.findMany({
    where: {
      organizationId,
      isActive: true,
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    take: limit,
  });
}

export async function countDepartmentMembers(departmentId: string) {
  return prisma.user.count({
    where: {
      departmentId,
    },
  });
}

export async function getRecentRecipientLogs(userId: string, limit: number) {
  return prisma.notificationLog.findMany({
    where: {
      userId,
      channel: "email",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      recipient: true,
      createdAt: true,
    },
    distinct: ["recipient"],
  });
}

export async function findUsersByEmails(emails: string[]) {
  return prisma.user.findMany({
    where: {
      email: {
        in: emails,
      },
    },
  });
}

export async function findOrgMembersForSuggestions(organizationId: string, userId: string, limit: number) {
  return prisma.organizationMember.findMany({
    where: {
      organizationId,
      user: {
        NOT: { id: userId },
      },
      role: {
        in: ["org_admin", "case_worker", "manager"],
      },
    },
    include: {
      user: {
        include: {
          department: true,
        },
      },
    },
    take: limit,
  });
}

export async function findOrganizationUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

export async function getDepartmentDetails(departmentId: string) {
  return prisma.department.findUnique({
    where: { id: departmentId },
  });
}

export async function getDepartmentMembers(departmentId: string, organizationId: string) {
  return prisma.user.findMany({
    where: {
      departmentId,
    },
    include: {
      OrganizationMember: {
        where: { organizationId },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRecentRecipientUsers(emails: string[]) {
  return prisma.user.findMany({
    where: {
      email: {
        in: emails,
      },
    },
  });
}
