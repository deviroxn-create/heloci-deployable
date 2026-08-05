/**
 * REVIEW SERVICE - Milestone 6.3
 * 
 * Manages review checklists for case workflows.
 * Creates default checklists when applications are submitted.
 * Tracks completion progress automatically.
 */

import { prisma } from "@/lib/prisma/client";

// Default checklist items for all applications
const DEFAULT_CHECKLIST_ITEMS = [
  { label: "Identity verified", category: "identity", order: 1 },
  { label: "Income verified", category: "income", order: 2 },
  { label: "Household composition verified", category: "household", order: 3 },
  { label: "Residency verified", category: "residency", order: 4 },
  { label: "Employment verified", category: "employment", order: 5 },
  { label: "Documents verified", category: "documents", order: 6 },
  { label: "Eligibility reviewed", category: "eligibility", order: 7 },
  { label: "Fraud screening completed", category: "fraud", order: 8 },
  { label: "Supervisor approval obtained", category: "approval", order: 9 },
];

/**
 * Get or create checklist for an application
 */
export async function getOrCreateChecklist(
  applicationId: string,
  userId: string,
  organizationId: string
) {
  // Verify access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: { include: { organization: true } } },
  });

  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (application.program.organization.id !== organizationId) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  // Get or create checklist
  let checklist = await prisma.reviewChecklist.findUnique({
    where: { applicationId },
    include: { items: { orderBy: { order: "asc" } } },
  });

  if (!checklist) {
    checklist = await prisma.reviewChecklist.create({
      data: {
        applicationId,
        totalItems: DEFAULT_CHECKLIST_ITEMS.length,
        items: {
          create: DEFAULT_CHECKLIST_ITEMS,
        },
      },
      include: { items: { orderBy: { order: "asc" } } },
    });
  }

  return checklist;
}

/**
 * Toggle checklist item completion
 */
export async function toggleChecklistItem(
  itemId: string,
  userId: string,
  organizationId: string,
  completed: boolean,
  notes?: string
) {
  // Get item and verify access
  const item = await prisma.reviewChecklistItem.findUnique({
    where: { id: itemId },
    include: {
      checklist: {
        include: {
          application: {
            include: { program: { include: { organization: true } } },
          },
        },
      },
    },
  });

  if (!item) throw new Error("CHECKLIST_ITEM_NOT_FOUND");

  const application = item.checklist.application;
  if (application.program.organization.id !== organizationId) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  // Update item
  const updated = await prisma.reviewChecklistItem.update({
    where: { id: itemId },
    data: {
      completed,
      completedBy: completed ? userId : null,
      completedAt: completed ? new Date() : null,
      notes: notes || item.notes,
    },
  });

  // Recalculate checklist progress
  await recalculateChecklistProgress(item.checklistId);

  // Create audit event
  await prisma.applicationEvent.create({
    data: {
      applicationId: application.id,
      type: "checklist_item_completed",
      actorId: userId,
      metadata: {
        itemId: itemId,
        label: item.label,
        category: item.category,
        completed,
      },
    },
  });

  return updated;
}

/**
 * Update checklist item notes
 */
export async function updateChecklistItemNotes(
  itemId: string,
  userId: string,
  organizationId: string,
  notes: string
) {
  const item = await prisma.reviewChecklistItem.findUnique({
    where: { id: itemId },
    include: {
      checklist: {
        include: {
          application: {
            include: { program: { include: { organization: true } } },
          },
        },
      },
    },
  });

  if (!item) throw new Error("CHECKLIST_ITEM_NOT_FOUND");

  const application = item.checklist.application;
  if (application.program.organization.id !== organizationId) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  return prisma.reviewChecklistItem.update({
    where: { id: itemId },
    data: { notes },
  });
}

/**
 * Recalculate checklist completion metrics
 */
async function recalculateChecklistProgress(checklistId: string) {
  const checklist = await prisma.reviewChecklist.findUnique({
    where: { id: checklistId },
    include: { items: true },
  });

  if (!checklist) return;

  const completedCount = checklist.items.filter((i) => i.completed).length;
  const totalCount = checklist.items.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  await prisma.reviewChecklist.update({
    where: { id: checklistId },
    data: {
      completedItems: completedCount,
      totalItems: totalCount,
      completionRate,
    },
  });
}

/**
 * Add custom checklist item
 */
export async function addChecklistItem(
  applicationId: string,
  userId: string,
  organizationId: string,
  label: string,
  category: string
) {
  // Verify access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: { include: { organization: true } } },
  });

  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (application.program.organization.id !== organizationId) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  // Get or create checklist
  const checklist = await getOrCreateChecklist(applicationId, userId, organizationId);

  // Get max order
  const maxOrder = await prisma.reviewChecklistItem.findFirst({
    where: { checklistId: checklist.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  // Add item
  const item = await prisma.reviewChecklistItem.create({
    data: {
      checklistId: checklist.id,
      label,
      category,
      order: (maxOrder?.order || 0) + 1,
    },
  });

  // Recalculate
  await recalculateChecklistProgress(checklist.id);

  return item;
}

/**
 * Get checklist summary for dashboard
 */
export async function getChecklistSummary(
  organizationId: string,
  userId: string
) {
  // Get all checklists for this org
  const checklists = await prisma.reviewChecklist.findMany({
    where: {
      application: {
        program: { organizationId },
      },
    },
    include: {
      application: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
          program: { select: { name: true } },
          status: true,
        },
      },
    },
  });

  return checklists.map((c) => ({
    applicationId: c.application.id,
    applicantName: c.application.user.name || c.application.user.email,
    programName: c.application.program.name,
    status: c.application.status,
    completedItems: c.completedItems,
    totalItems: c.totalItems,
    completionRate: c.completionRate,
  }));
}
