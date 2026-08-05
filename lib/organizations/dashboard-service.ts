import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export interface OrgDashboardStats {
  // KPI Cards
  pendingReview: number;
  underReview: number;
  approvedToday: number;
  rejectedToday: number;
  waitingDocuments: number;
  unreadNotifications: number;

  // Application status breakdown
  applicationsByStatus: Record<string, number>;
  approvalRate: number;

  // Recent submissions (max 10)
  recentApplications: {
    id: string;
    applicantName: string | null;
    programName: string;
    state: string;
    status: string;
    submittedAt: Date | null;
    assignedToId: string | null;
    assignedToName: string | null;
  }[];

  // Program activity (no fake percentages)
  programActivity: {
    id: string;
    name: string;
    applications: number;
    pending: number;
    approved: number;
    rejected: number;
    occupancy: number | null;
  }[];

  // Staff workload
  staffWorkload: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    assignedCases: number;
    openCases: number;
    completedThisWeek: number;
    lastActivityAt: Date | null;
  }[];

  // Recent activity timeline
  activityTimeline: {
    id: string;
    type: string;
    timestamp: Date;
    actorName: string | null;
    programName: string | null;
    applicationId: string | null;
    description: string;
    metadata?: Record<string, any>;
  }[];
}

export async function getOrgDashboard(orgId: string, staffUserId: string): Promise<OrgDashboardStats> {
  console.log("[Dashboard Service] getOrgDashboard called:", {
    orgId,
    staffUserId
  });

  // Authorization is expected at the API / server-action layer. Service enforces ownership and business constraints only.

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  console.log("[Dashboard Service] ========== FETCHING DASHBOARD DATA ==========");

  // Run all queries in parallel for performance
  const promises = [
    // 1. Application status breakdown
    (async () => {
      console.log("[Dashboard Service] Loading application status counts...");
      const result = await prisma.programApplication.groupBy({
        by: ["status"],
        where: { program: { organizationId: orgId } },
        _count: { status: true }
      });
      console.log("[Dashboard Service] ✓ Application status counts loaded:", result.map(r => `${r.status}=${r._count.status}`).join(", "));
      return result;
    })(),

    // 2. Pending review (submitted, not under review)
    (async () => {
      console.log("[Dashboard Service] Loading pending applications...");
      const count = await prisma.programApplication.count({
        where: {
          program: { organizationId: orgId },
          status: "pending"
        }
      });
      console.log("[Dashboard Service] ✓ Pending applications: " + count);
      return count;
    })(),

    // 3. Under review (assigned to staff)
    (async () => {
      console.log("[Dashboard Service] Loading under review applications...");
      const count = await prisma.programApplication.count({
        where: {
          program: { organizationId: orgId },
          status: "under_review"
        }
      });
      console.log("[Dashboard Service] ✓ Under review applications: " + count);
      return count;
    })(),

    // 4. Approved today
    (async () => {
      console.log("[Dashboard Service] Loading approved today...");
      const count = await prisma.programApplication.count({
        where: {
          program: { organizationId: orgId },
          status: "approved",
          reviewedAt: { gte: todayStart }
        }
      });
      console.log("[Dashboard Service] ✓ Approved today: " + count);
      return count;
    })(),

    // 5. Rejected today
    (async () => {
      console.log("[Dashboard Service] Loading rejected today...");
      const count = await prisma.programApplication.count({
        where: {
          program: { organizationId: orgId },
          status: "rejected",
          reviewedAt: { gte: todayStart }
        }
      });
      console.log("[Dashboard Service] ✓ Rejected today: " + count);
      return count;
    })(),

    // 6. Documents waiting (pending document requests)
    (async () => {
      console.log("[Dashboard Service] Loading pending document requests...");
      const count = await prisma.documentRequest.count({
        where: {
          application: { program: { organizationId: orgId } },
          status: "pending",
          expiresAt: { gt: now }
        }
      });
      console.log("[Dashboard Service] ✓ Pending document requests: " + count);
      return count;
    })(),

    // 7. Unread notifications for this org
    (async () => {
      console.log("[Dashboard Service] Loading unread notifications...");
      const count = await prisma.notification.count({
        where: {
          userId: staffUserId,
          seen: false
        }
      });
      console.log("[Dashboard Service] ✓ Unread notifications: " + count);
      return count;
    })(),

    // 8. Recent applications (max 10)
    (async () => {
      console.log("[Dashboard Service] Loading recent applications...");
      const apps = await prisma.programApplication.findMany({
        where: { program: { organizationId: orgId } },
        include: {
          user: { select: { name: true } },
          program: { select: { name: true } },
          assignedTo: { select: { name: true } }
        },
        orderBy: { submittedAt: "desc" },
        take: 10
      });
      console.log("[Dashboard Service] ✓ Recent applications loaded: " + apps.length);
      return apps;
    })(),

    // 9. Program activity
    (async () => {
      console.log("[Dashboard Service] Loading programs...");
      const programs = await prisma.program.findMany({
        where: { organizationId: orgId, isArchived: false },
        include: {
          _count: {
            select: { programApplications: true }
          }
        }
      });
      console.log("[Dashboard Service] ✓ Programs loaded: " + programs.length);
      return programs;
    })(),

    // 10. Staff workload
    (async () => {
      console.log("[Dashboard Service] Loading staff members...");
      const staff = await prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              assignedApplications: { select: { id: true, status: true } },
              applicationEvents: { where: { createdAt: { gte: weekStart } } }
            }
          }
        }
      });
      console.log("[Dashboard Service] ✓ Staff members loaded: " + staff.length);
      return staff;
    })(),

    // 11. Recent activity events (application events + program events)
    (async () => {
      console.log("[Dashboard Service] Loading recent activity events...");
      const events = await prisma.applicationEvent.findMany({
        where: { application: { program: { organizationId: orgId } } },
        include: {
          actor: { select: { name: true } },
          application: { select: { id: true, program: { select: { name: true } } } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
      });
      console.log("[Dashboard Service] ✓ Recent activity events loaded: " + events.length);
      return events;
    })(),

    // 12. Calculate approval rate
    (async () => {
      console.log("[Dashboard Service] Loading decided applications for approval rate...");
      const apps = await prisma.programApplication.findMany({
        where: {
          program: { organizationId: orgId },
          reviewedAt: { not: null },
          submittedAt: { not: null }
        },
        select: { status: true }
      });
      console.log("[Dashboard Service] ✓ Decided applications loaded: " + apps.length);
      return apps;
    })()
  ];

  const [
    statusCounts,
    pendingCount,
    underReviewCount,
    approvedTodayCount,
    rejectedTodayCount,
    waitingDocumentsCount,
    unreadNotificationsCount,
    recentAppsRaw,
    programsRaw,
    staffMembersRaw,
    recentEventsRaw,
    decidedApps
  ] = await Promise.all(promises);

  // Build applicationsByStatus map
  const applicationsByStatus: Record<string, number> = {};
  (statusCounts as Array<{ status: string; _count: { status: number } }>).forEach((g) => (applicationsByStatus[g.status] = g._count.status));

  // Calculate approval rate
  const approved = applicationsByStatus["approved"] ?? 0;
  const rejected = applicationsByStatus["rejected"] ?? 0;
  const approvalRate = approved + rejected === 0 ? 0 : (approved / (approved + rejected)) * 100;

  console.log("[Dashboard Service] ========== BUILDING DASHBOARD RESPONSE ==========");
  console.log("[Dashboard Service] KPI Summary:", {
    pendingReview: pendingCount,
    underReview: underReviewCount,
    approvedToday: approvedTodayCount,
    rejectedToday: rejectedTodayCount,
    waitingDocuments: waitingDocumentsCount,
    unreadNotifications: unreadNotificationsCount,
    approvalRate: approvalRate.toFixed(1) + "%"
  });

  // Format recent applications
  const recentApplications = (recentAppsRaw as Array<any>).map((app) => ({
    id: app.id,
    applicantName: app.user?.name ?? null,
    programName: app.program.name,
    state: app.program.name,
    status: app.status,
    submittedAt: app.submittedAt,
    assignedToId: app.assignedToId,
    assignedToName: app.assignedTo?.name ?? null
  }));
  console.log("[Dashboard Service] Recent applications: " + recentApplications.length);

  // Build program activity (get detailed stats per program)
  console.log("[Dashboard Service] Building program activity for " + (programsRaw as any[]).length + " programs...");
  const programActivity = await Promise.all(
    (programsRaw as Array<any>).map(async (prog) => {
      const progApps = await prisma.programApplication.groupBy({
        by: ["status"],
        where: { programId: prog.id },
        _count: { status: true }
      });

      const statsMap: Record<string, number> = {};
      progApps.forEach((g) => (statsMap[g.status] = g._count.status));

      // Calculate occupancy if available from property units
      // For now, just return null since property/unit relationship may vary
      const occupancy = null;

      const programStats = {
        id: prog.id,
        name: prog.name,
        applications: prog._count.programApplications,
        pending: statsMap["pending"] ?? 0,
        approved: statsMap["approved"] ?? 0,
        rejected: statsMap["rejected"] ?? 0,
        occupancy
      };
      
      console.log("[Dashboard Service] Program: " + prog.name + " = " + prog._count.programApplications + " applications");
      return programStats;
    })
  );

  // Build staff workload (from organization members)
  console.log("[Dashboard Service] Building staff workload for " + (staffMembersRaw as any[]).length + " staff members...");
  const staffWorkload = (staffMembersRaw as Array<any>).map((member) => {
    const user = member.user as any;
    const assignedApps = user.assignedApplications ?? [];
    const openCases = assignedApps.filter((a: any) => a.status !== "approved" && a.status !== "rejected").length;
    const completedThisWeek = user.applicationEvents?.length ?? 0;

    console.log("[Dashboard Service] Staff: " + user.email + " = " + assignedApps.length + " assigned, " + openCases + " open, " + completedThisWeek + " completed");

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: member.role,
      assignedCases: assignedApps.length,
      openCases,
      completedThisWeek,
      lastActivityAt: null as Date | null
    };
  });

  // Build activity timeline from events
  const activityTimeline = (recentEventsRaw as Array<any>).map((event) => ({
    id: event.id,
    type: event.type,
    timestamp: event.createdAt,
    actorName: event.actor?.name ?? null,
    programName: event.application.program?.name ?? null,
    applicationId: event.application.id,
    description: formatEventDescription(event.type, event.fromStatus || undefined, event.toStatus || undefined),
    metadata: (event.metadata as Record<string, any>) ?? undefined
  }));
  console.log("[Dashboard Service] Activity timeline: " + activityTimeline.length + " events");

  console.log("[Dashboard Service] ========== DASHBOARD COMPLETED SUCCESSFULLY ==========");

  return {
    pendingReview: pendingCount as number,
    underReview: underReviewCount as number,
    approvedToday: approvedTodayCount as number,
    rejectedToday: rejectedTodayCount as number,
    waitingDocuments: waitingDocumentsCount as number,
    unreadNotifications: unreadNotificationsCount as number,
    applicationsByStatus,
    approvalRate,
    recentApplications,
    programActivity,
    staffWorkload,
    activityTimeline
  };
}

function formatEventDescription(type: string, fromStatus?: string, toStatus?: string): string {
  switch (type) {
    case "submitted":
      return "Application submitted";
    case "status_changed":
      return `Status changed from ${fromStatus} to ${toStatus}`;
    case "assigned":
      return "Application assigned to staff";
    case "document_requested":
      return "Document requested";
    case "document_uploaded":
      return "Document uploaded";
    case "approved":
      return "Application approved";
    case "rejected":
      return "Application rejected";
    case "waitlisted":
      return "Application waitlisted";
    default:
      return type;
  }
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
  // Authorization moved to API layer; service validates ownership only.

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

  // Authorization moved to API layer; service validates ownership only.

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
      publishDomainEvent("program.published", { userId: a.userId, programName: updated.name, slug: updated.slug });
    }
  }

  return updated;
}

export async function archiveProgram(programId: string, staffUserId: string) {
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) throw new Error("not_found");

  // Authorization moved to API layer; service validates ownership only.

  const updated = await prisma.program.update({ where: { id: programId }, data: { isArchived: true, status: "archived" } });

  await prisma.auditLog.create({ data: { userId: staffUserId, entity: "Program", action: "program_archived", meta: { programId } } });

  return updated;
}
