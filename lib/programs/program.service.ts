import { prisma } from "@/lib/prisma/client";

export async function getPublicProgramBySlug(slug: string) {
  return prisma.program.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      summary: true,
      description: true,
      matchDescription: true,
      category: true,
      housingGoal: true,
      deadline: true,
      isPublic: true,
      isArchived: true,
      status: true,
      requiredDocuments: true,
      eligibilitySummary: true,
      organization: { select: { id: true, name: true } },
      questionSets: {
        where: { isActive: true },
        select: { id: true },
        take: 1,
      },
    },
  });
}

export async function getFeaturedPrograms() {
  return prisma.program.findMany({
    where: { status: "active", isArchived: false, isPublic: true },
    orderBy: { priority: "desc" },
    take: 6,
    select: {
      id: true,
      name: true,
      slug: true,
      housingGoal: true,
      category: true,
      matchDescription: true,
      summary: true,
      status: true,
      deadline: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getPublicPrograms() {
  return prisma.program.findMany({
    where: {
      status: "active",
      isArchived: false,
      isPublic: true,
    },
    orderBy: {
      priority: "desc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      matchDescription: true,
      category: true,
      deadline: true,
    },
  });
}

export async function getProgramForAdmin(programId: string) {
  return prisma.program.findUnique({ where: { id: programId } });
}

export async function getProgramsForAdmin(orgId: string) {
  return prisma.program.findMany({
    where: { organizationId: orgId, isArchived: false },
    orderBy: { priority: "desc" },
  });
}

export async function getOrganizationMembers(orgId: string) {
  return prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: true },
  });
}
