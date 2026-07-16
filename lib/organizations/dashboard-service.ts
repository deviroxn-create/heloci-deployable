import { prisma } from "@/lib/prisma/client";
import { requireOrgRole } from "@/lib/auth/rbac";
import { notificationService } from "@/lib/notifications/notification.service";

export interface OrgDashboardStats {
  totalPrograms: number;
  activePrograms: number;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  approvalRate: number;
  avgDecisionDays: number | null;
  recentApplications: {
    id: string;
    applicantName: string | null;
    programName: string;
    status: string;
    submittedAt: Date | null;
  }[];
}

export async function getOrgDashboard(orgId: string, staffUserId: string): Promise<OrgDashboardStats> {
  await requireOrgRole(staffUserId, orgId, ["org_admin", "reviewer", "viewer"]);

  const totalPrograms = await prisma.program.count({ where: { organizationId: orgId, isArchived: false } });
  const activePrograms = await prisma.program.count({ where: { organizationId: orgId, status: "active", isArchived: false } });

  const whereApps: any = { program: { organizationId: orgId } };

  const totalApplications = await prisma.programApplication.count({ where: whereApps });

  const group = await prisma.programApplication.groupBy({
    by: ["status"],
    where: whereApps,
    _count: { status: true }
  });

  const applicationsByStatus: Record<string, number> = {};
  group.forEach((g) => (applicationsByStatus[g.status] = g._count.status));

  const approved = applicationsByStatus["approved"] ?? 0;
  const rejected = applicationsByStatus["rejected"] ?? 0;
  const approvalRate = approved + rejected === 0 ? 0 : (approved / (approved + rejected)) * 100;

  // avg decision days
  const decided = await prisma.programApplication.findMany({
    where: { program: { organizationId: orgId }, reviewedAt: { not: null }, submittedAt: { not: null } },
    select: { reviewedAt: true, submittedAt: true }
  });

  const avgDecisionDays = decided.length
    ? decided.reduce((acc, cur) => acc + (cur.reviewedAt!.getTime() - cur.submittedAt!.getTime()), 0) / decided.length / (1000 * 60 * 60 * 24)
    : null;

  const recentApplicationsRaw = await prisma.programApplication.findMany({
    where: whereApps,
    include: { user: true, program: true },
    orderBy: { submittedAt: "desc" },
    take: 5
  });

  const recentApplications = recentApplicationsRaw.map((a) => ({
    id: a.id,
    applicantName: a.user?.name ?? null,
    programName: a.program.name,
    status: a.status,
    submittedAt: a.submittedAt
  }));

  return {
    totalPrograms,
    activePrograms,
    totalApplications,
    applicationsByStatus,
    approvalRate,
    avgDecisionDays,
    recentApplications
  };
}

export async function createProgram(orgId: string, staffUserId: string, data: {
  name: string;
  slug: string;
  housingGoal: string;
  category: string;
  description?: string;
  deadline?: Date;
  matchDescription?: string;
  requiredDocuments?: string[];
}) {
  await requireOrgRole(staffUserId, orgId, ["org_admin"]);

  const existing = await prisma.program.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error("slug_taken");

  const program = await prisma.program.create({
    data: {
      organizationId: orgId,
      name: data.name,
      slug: data.slug,
      createdBy: staffUserId,
      housingGoal: data.housingGoal,
      category: data.category,
      description: data.description,
      deadline: data.deadline ?? null,
      matchDescription: data.matchDescription ?? null,
      requiredDocuments: data.requiredDocuments ? { set: data.requiredDocuments } : undefined,
      status: "draft",
      isArchived: false
    }
  });

  await prisma.auditLog.create({ data: { userId: staffUserId, entity: "Program", action: "program_created", meta: { programId: program.id } } });

  return program;
}

export async function updateProgram(programId: string, staffUserId: string, data: Partial<any>) {
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) throw new Error("not_found");

  await requireOrgRole(staffUserId, program.organizationId, ["org_admin"]);

  const updateData: any = { ...data };
  if (data.status === "active" && !program.publishedAt) {
    updateData.publishedAt = new Date();
  }

  const updated = await prisma.program.update({ where: { id: programId }, data: updateData });

  await prisma.auditLog.create({ data: { userId: staffUserId, entity: "Program", action: "program_updated", meta: { programId } } });

  if (data.status === "active") {
    // notify org admins
    const admins = await prisma.organizationMember.findMany({ where: { organizationId: program.organizationId, role: "org_admin" }, include: { user: true } });
    for (const a of admins) {
      await notificationService.notify("program_published", { userId: a.userId, programName: updated.name, slug: updated.slug });
    }
  }

  return updated;
}

export async function archiveProgram(programId: string, staffUserId: string) {
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) throw new Error("not_found");

  await requireOrgRole(staffUserId, program.organizationId, ["org_admin"]);

  const updated = await prisma.program.update({ where: { id: programId }, data: { isArchived: true, status: "archived" } });

  await prisma.auditLog.create({ data: { userId: staffUserId, entity: "Program", action: "program_archived", meta: { programId } } });

  return updated;
}
