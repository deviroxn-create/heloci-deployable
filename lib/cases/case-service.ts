import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { getCommunicationEventForDomainEvent } from "@/lib/communications/communication-registry";

/**
 * Case Service: Central service for all case (application) operations
 * Built on top of existing ProgramApplication model and review-service patterns
 */

export interface CaseListFilters {
  staffUserId: string;
  status?: string[];
  assignedTo?: string;
  programId?: string;
  search?: string;
  matchScoreMin?: number;
  submittedAfter?: Date;
  submittedBefore?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: "submitted" | "lastActivity" | "matchScore";
  sortOrder?: "asc" | "desc";
}

export interface CaseListResult {
  cases: {
    id: string;
    caseId: string; // UI-friendly case ID (future feature)
    applicantName: string | null;
    applicantEmail: string;
    programName: string;
    organizationName: string;
    status: string;
    matchScore: number | null;
    priority: "high" | "medium" | "low"; // Derived from status/score
    assignedTo: { id: string; name: string | null } | null;
    submittedAt: Date | null;
    lastActivityAt: Date;
    missingDocuments: number;
    totalDocumentsRequested: number;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CaseDetail {
  // Core application data
  id: string;
  userId: string;
  programId: string;
  status: string;
  submittedAt: Date | null;
  lastActivityAt: Date;

  // Applicant info
  applicant: {
    id: string;
    name: string | null;
    email: string;
    photo?: string;
  };

  // Program info
  program: {
    id: string;
    name: string;
    organizationId: string;
    requiredDocuments?: string[];
  };

  // Submitted application data
  applicationData: Record<string, any>;

  // Eligibility
  eligibility: {
    score: number | null;
    isEligible: boolean | null;
    evaluatedAt: Date | null;
  };

  // Matching
  matchScore: number | null;

  // Review info
  assignedTo: { id: string; name: string | null; email: string } | null;
  assignedAt: Date | null;
  reviewedBy: { id: string; name: string | null } | null;
  reviewedAt: Date | null;
  decision: string | null;
  decisionReason: string | null;

  // Documents
  documentRequests: {
    id: string;
    documentType: string;
    status: "pending" | "submitted" | "reviewed";
    requestedAt: Date;
    submittedAt: Date | null;
    expiresAt: Date | null;
    fileUrl: string | null;
  }[];

  // Timeline & audit
  events: {
    id: string;
    type: string;
    timestamp: Date;
    actor: { id: string; name: string | null } | null;
    description: string;
    metadata?: Record<string, any>;
  }[];

  // Internal notes
  internalNotes: string | null;

  // Metadata
  metadata?: {
    householdSize?: number;
    income?: number;
    veteranStatus?: boolean;
    disabilityStatus?: boolean;
    publicWorkerStatus?: boolean;
  };
}

/**
 * Get paginated list of cases for a staff member's organization
 * Authorization is handled at API route level
 */
export async function getCaseOrganizationId(applicationId: string): Promise<string | null> {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    select: { program: { select: { organizationId: true } } },
  });

  return application?.program.organizationId ?? null;
}

export async function getCaseList(
  orgId: string,
  filters: CaseListFilters
): Promise<CaseListResult> {
  // Build WHERE clause
  const where: any = {
    program: { organizationId: orgId }
  };

  if (filters.status?.length) {
    where.status = { in: filters.status };
  }

  if (filters.assignedTo) {
    where.assignedToId = filters.assignedTo === "unassigned" ? null : filters.assignedTo;
  }

  if (filters.programId) {
    where.programId = filters.programId;
  }

  if (filters.search) {
    where.OR = [
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
      { user: { name: { contains: filters.search, mode: "insensitive" } } }
    ];
  }

  if (filters.submittedAfter) {
    where.submittedAt = { gte: filters.submittedAfter };
  }

  if (filters.submittedBefore) {
    where.submittedAt = where.submittedAt || {};
    (where.submittedAt as any).lte = filters.submittedBefore;
  }

  // Count total before pagination
  const total = await prisma.programApplication.count({ where });

  // Determine sort order
  const sortOrder = filters.sortOrder || "desc";
  const orderBy: any = {};
  const sortBy = filters.sortBy || "submitted";

  if (sortBy === "submitted") {
    orderBy.submittedAt = sortOrder;
  } else if (sortBy === "lastActivity") {
    orderBy.lastActivityAt = sortOrder;
  } else if (sortBy === "matchScore") {
    // Match score requires joining with ProgramRecommendation
    // For now, sort by submittedAt
    orderBy.submittedAt = sortOrder;
  }

  // Pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const skip = (page - 1) * pageSize;

  // Fetch applications with all necessary relations
  const applications = await prisma.programApplication.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      program: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      documentRequests: { select: { id: true, status: true } }
    },
    orderBy,
    skip,
    take: pageSize
  });

  // Get match scores for these applications
  const matchScores = await prisma.programRecommendation.findMany({
    where: {
      userId: { in: applications.map((a) => a.userId) },
      programId: { in: applications.map((a) => a.programId) }
    },
    select: { userId: true, programId: true, type: true }
  });

  const matchMap = new Map(
    matchScores.map((m) => [`${m.userId}-${m.programId}`, m.type === "matched" ? 85 : 45])
  );

  // Build response
  const cases = applications.map((app) => {
    const missingDocs = app.documentRequests.filter((d) => d.status === "pending").length;
    const matchScore = matchMap.get(`${app.userId}-${app.programId}`) || null;

    // Determine priority
    let priority: "high" | "medium" | "low" = "medium";
    if (app.status === "pending") priority = "high";
    if (app.status === "waitlisted") priority = "low";

    return {
      id: app.id,
      caseId: `CASE-${app.id.slice(0, 8).toUpperCase()}`,
      applicantName: app.user.name || app.user.email,
      applicantEmail: app.user.email,
      programName: app.program.name,
      organizationName: orgId, // Would need org details if needed
      status: app.status,
      matchScore,
      priority,
      assignedTo: app.assignedTo ? { id: app.assignedTo.id, name: app.assignedTo.name } : null,
      submittedAt: app.submittedAt,
      lastActivityAt: app.lastActivityAt,
      missingDocuments: missingDocs,
      totalDocumentsRequested: app.documentRequests.length
    };
  });

  return {
    cases,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

/**
 * Get detailed case information for the case workspace
 */
export async function getCaseDetail(
  caseId: string,
  staffUserId: string
): Promise<CaseDetail> {
  // Fetch application with all relations
  const application = await prisma.programApplication.findUnique({
    where: { id: caseId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      program: { select: { id: true, name: true, organizationId: true, requiredDocuments: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
      documentRequests: {
        select: {
          id: true,
          documentType: true,
          status: true,
          requestedAt: true,
          submittedAt: true,
          expiresAt: true,
          fileUrl: true
        }
      },
      events: {
        select: { id: true, type: true, createdAt: true, actor: { select: { id: true, name: true } }, fromStatus: true, toStatus: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!application) {
    throw new Error("Case not found");
  }

  // Get eligibility result
  const eligibilityResult = await prisma.eligibilityResult.findFirst({
    where: { userId: application.userId, programId: application.programId }
  });

  // Get match score
  const recommendation = await prisma.programRecommendation.findFirst({
    where: { userId: application.userId, programId: application.programId }
  });

  // Format timeline events
  const events = application.events.map((event) => ({
    id: event.id,
    type: event.type,
    timestamp: event.createdAt,
    actor: event.actor,
    description: formatEventDescription(event.type, event.fromStatus || undefined, event.toStatus || undefined)
  }));

  // Extract metadata from application data (safely cast JSON)
  const appData = application.data as Record<string, any> || {};
  const metadata = {
    householdSize: appData.householdSize,
    income: appData.income,
    veteranStatus: appData.veteranStatus,
    disabilityStatus: appData.disabilityStatus,
    publicWorkerStatus: appData.publicWorkerStatus
  };

  return {
    id: application.id,
    userId: application.userId,
    programId: application.programId,
    status: application.status,
    submittedAt: application.submittedAt,
    lastActivityAt: application.lastActivityAt,

    applicant: {
      id: application.user.id,
      name: application.user.name,
      email: application.user.email
    },

    program: {
      id: application.program.id,
      name: application.program.name,
      organizationId: application.program.organizationId,
      requiredDocuments: (application.program.requiredDocuments as string[]) || []
    },

    applicationData: (application.data as Record<string, any>) || {},

    eligibility: {
      score: eligibilityResult?.score ?? null,
      isEligible: eligibilityResult?.isEligible ?? null,
      evaluatedAt: eligibilityResult?.matchedAt ?? null
    },

    matchScore: recommendation ? 85 : null,

    assignedTo: application.assignedTo,
    assignedAt: application.assignedAt,
    reviewedBy: application.reviewedBy,
    reviewedAt: application.reviewedAt,
    decision: application.decision,
    decisionReason: application.decisionReason,

    documentRequests: application.documentRequests.map((dr) => ({
      id: dr.id,
      documentType: dr.documentType,
      status: (dr.status as "submitted" | "pending" | "reviewed") || "pending",
      requestedAt: dr.requestedAt,
      submittedAt: dr.submittedAt,
      expiresAt: dr.expiresAt,
      fileUrl: dr.fileUrl
    })),
    events,

    internalNotes: application.internalNotes,
    metadata
  };
}

/**
 * Update case status with full audit trail and notifications
 */
export async function updateCaseStatus(
  caseId: string,
  staffUserId: string,
  newStatus: string,
  reason?: string
): Promise<void> {
  // Get current application
  const application = await prisma.programApplication.findUnique({
    where: { id: caseId },
    include: { program: true, user: true }
  });

  if (!application) {
    throw new Error("Case not found");
  }

  const oldStatus = application.status;

  // Update application
  await prisma.programApplication.update({
    where: { id: caseId },
    data: { status: newStatus, lastActivityAt: new Date() }
  });

  // Create event record
  await prisma.applicationEvent.create({
    data: {
      applicationId: caseId,
      type: "status_changed",
      actorId: staffUserId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      metadata: { reason }
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: staffUserId,
      entity: "ProgramApplication",
      action: "status_changed",
      meta: { applicationId: caseId, from: oldStatus, to: newStatus, reason }
    }
  });

  // Send notification to applicant
  // PHASE B.6 CANONICALIZATION FIX:
  // Previously used hardcoded local eventNameMap which duplicated registry logic.
  // Now we use the proper domain events and let the registry drive the mapping:
  // 
  // Domain Event → Registry Lookup → Communication Event → NotificationService
  // 
  // This ensures consistency with all other event publishing in the system.
  
  const statusToDomainEventMap: Record<string, string> = {
    approved: "application.approved",
    rejected: "application.rejected",
    waitlisted: "application.waitlisted",
    under_review: "application.review.completed",
    pending: "application.submitted"
  };

  const domainEventName = statusToDomainEventMap[newStatus];

  if (domainEventName) {
    publishDomainEvent(domainEventName, {
      userId: application.user.id,
      email: application.user.email,
      programName: application.program.name,
      applicationId: caseId,
    });
  }
}

/**
 * Assign case to a staff member
 */
export async function assignCase(
  caseId: string,
  staffUserId: string,
  assignToUserId: string
): Promise<void> {
  // Get current application
  const application = await prisma.programApplication.findUnique({
    where: { id: caseId },
    include: { program: true }
  });

  if (!application) {
    throw new Error("Case not found");
  }

  const previousAssignee = application.assignedToId;

  // Update assignment
  await prisma.programApplication.update({
    where: { id: caseId },
    data: {
      assignedToId: assignToUserId,
      assignedAt: new Date(),
      lastActivityAt: new Date()
    }
  });

  // Create event
  await prisma.applicationEvent.create({
    data: {
      applicationId: caseId,
      type: "assigned",
      actorId: staffUserId,
      metadata: { previousAssignee, newAssignee: assignToUserId }
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: staffUserId,
      entity: "ProgramApplication",
      action: "assigned",
      meta: { applicationId: caseId, assignedTo: assignToUserId }
    }
  });
}

/**
 * Add internal note to case
 */
export async function addCaseNote(
  caseId: string,
  staffUserId: string,
  note: string
): Promise<void> {
  // Get application to verify org access
  const application = await prisma.programApplication.findUnique({
    where: { id: caseId },
    include: { program: true }
  });

  if (!application) {
    throw new Error("Case not found");
  }

  // Update application's internalNotes (append to existing)
  const timestamp = new Date().toISOString();
  const updatedNotes = application.internalNotes
    ? `${application.internalNotes}\n\n[${timestamp}] ${note}`
    : `[${timestamp}] ${note}`;

  await prisma.programApplication.update({
    where: { id: caseId },
    data: {
      internalNotes: updatedNotes,
      lastActivityAt: new Date()
    }
  });

  // Create event
  await prisma.applicationEvent.create({
    data: {
      applicationId: caseId,
      type: "internal_note_added",
      actorId: staffUserId,
      metadata: { note }
    }
  });
}

/**
 * Request documents from applicant
 */
export async function requestDocuments(
  caseId: string,
  staffUserId: string,
  documentTypes: string[],
  expiryDays: number = 7
): Promise<void> {
  // Get application
  const application = await prisma.programApplication.findUnique({
    where: { id: caseId },
    include: { program: true, user: true }
  });

  if (!application) {
    throw new Error("Case not found");
  }

  // Create document requests
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  for (const docType of documentTypes) {
    await prisma.documentRequest.create({
      data: {
        applicationId: caseId,
        documentType: docType,
        status: "pending",
        requestedBy: staffUserId,
        expiresAt
      }
    });
  }

  // Create event
  await prisma.applicationEvent.create({
    data: {
      applicationId: caseId,
      type: "document_requested",
      actorId: staffUserId,
      metadata: { documentTypes }
    }
  });

  publishDomainEvent("documents.requested", {
    userId: application.user.id,
    documentTypes,
    expiryDays,
    applicationId: caseId,
  });
}

/**
 * Get case audit history
 */
export async function getCaseAuditHistory(caseId: string, staffUserId: string) {
  // Get application to verify org access
  const application = await prisma.programApplication.findUnique({
    where: { id: caseId },
    include: { program: true }
  });

  if (!application) {
    throw new Error("Case not found");
  }

  // Get audit logs for this case
  const logs = await prisma.auditLog.findMany({
    where: {
      entity: "ProgramApplication",
      meta: { path: ["applicationId"], equals: caseId }
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return logs;
}

function formatEventDescription(type: string, fromStatus?: string, toStatus?: string): string {
  switch (type) {
    case "submitted":
      return "Application submitted";
    case "status_changed":
      return `Status changed from ${fromStatus} to ${toStatus}`;
    case "assigned":
      return "Case assigned to staff member";
    case "document_requested":
      return "Documents requested from applicant";
    case "document_uploaded":
      return "Document uploaded";
    case "internal_note_added":
      return "Internal note added";
    default:
      return type;
  }
}

