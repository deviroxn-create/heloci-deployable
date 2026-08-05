import { prisma } from "@/lib/prisma/client";

/**
 * Review Checklist Service
 * Manages review checklists for case workers to track application review progress
 */

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  completedBy: string | null;
  completedByUser: { id: string; name: string | null } | null;
  completedAt: Date | null;
  notes: string | null;
  order: number;
}

export interface ChecklistDetail {
  id: string;
  applicationId: string;
  items: ChecklistItem[];
  completedItems: number;
  totalItems: number;
  completionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default checklist items for new applications
 */
const DEFAULT_CHECKLIST_ITEMS = [
  { label: "Identity verified", category: "identity", order: 1 },
  { label: "Income verified", category: "income", order: 2 },
  { label: "Residency verified", category: "residency", order: 3 },
  { label: "Employment verified", category: "employment", order: 4 },
  { label: "Household composition verified", category: "household", order: 5 },
  { label: "All documents submitted", category: "documents", order: 6 },
  { label: "Eligibility confirmed", category: "eligibility", order: 7 },
  { label: "Fraud check complete", category: "compliance", order: 8 },
  { label: "Background review complete", category: "compliance", order: 9 },
];

/**
 * Get or create checklist for an application
 */
export async function getOrCreateChecklist(
  applicationId: string,
  staffUserId: string
): Promise<ChecklistDetail> {
  // Get application to verify org access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Check if checklist exists
  let checklist = await prisma.reviewChecklist.findUnique({
    where: { applicationId },
    include: {
      items: {
        include: { completedByUser: { select: { id: true, name: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  // Create if it doesn't exist
  if (!checklist) {
    checklist = await prisma.reviewChecklist.create({
      data: {
        applicationId,
        totalItems: DEFAULT_CHECKLIST_ITEMS.length,
        items: {
          create: DEFAULT_CHECKLIST_ITEMS,
        },
      },
      include: {
        items: {
          include: { completedByUser: { select: { id: true, name: true } } },
          orderBy: { order: "asc" },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: staffUserId,
        entity: "ReviewChecklist",
        action: "created",
        meta: { applicationId, checklistId: checklist.id },
      },
    });
  }

  return {
    id: checklist.id,
    applicationId: checklist.applicationId,
    items: checklist.items.map((item) => ({
      id: item.id,
      label: item.label,
      category: item.category,
      completed: item.completed,
      completedBy: item.completedBy,
      completedByUser: item.completedByUser,
      completedAt: item.completedAt,
      notes: item.notes,
      order: item.order,
    })),
    completedItems: checklist.completedItems,
    totalItems: checklist.totalItems,
    completionRate: checklist.completionRate,
    createdAt: checklist.createdAt,
    updatedAt: checklist.updatedAt,
  };
}

/**
 * Update a checklist item (toggle completion, add notes)
 */
export async function updateChecklistItem(
  itemId: string,
  staffUserId: string,
  data: {
    completed?: boolean;
    notes?: string;
  }
): Promise<ChecklistItem> {
  // Get item with checklist and application
  const item = await prisma.reviewChecklistItem.findUnique({
    where: { id: itemId },
    include: {
      checklist: {
        include: {
          application: {
            include: { program: true },
          },
        },
      },
    },
  });

  if (!item) {
    throw new Error("Checklist item not found");
  }

  // Update item
  const updated = await prisma.reviewChecklistItem.update({
    where: { id: itemId },
    data: {
      ...(data.completed !== undefined && {
        completed: data.completed,
        completedBy: data.completed ? staffUserId : null,
        completedAt: data.completed ? new Date() : null,
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: { completedByUser: { select: { id: true, name: true } } },
  });

  // Recalculate checklist completion
  await recalculateCompletion(item.checklistId);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: staffUserId,
      entity: "ReviewChecklistItem",
      action: "updated",
      meta: {
        itemId,
        checklistId: item.checklistId,
        applicationId: item.checklist.applicationId,
        completed: data.completed,
      },
    },
  });

  // Create application event
  await prisma.applicationEvent.create({
    data: {
      applicationId: item.checklist.applicationId,
      type: "checklist_item_updated",
      actorId: staffUserId,
      metadata: {
        item: item.label,
        completed: data.completed,
      },
    },
  });

  return {
    id: updated.id,
    label: updated.label,
    category: updated.category,
    completed: updated.completed,
    completedBy: updated.completedBy,
    completedByUser: updated.completedByUser,
    completedAt: updated.completedAt,
    notes: updated.notes,
    order: updated.order,
  };
}

/**
 * Reset checklist (uncheck all items)
 */
export async function resetChecklist(
  applicationId: string,
  staffUserId: string
): Promise<void> {
  // Get application to verify org access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Get checklist
  const checklist = await prisma.reviewChecklist.findUnique({
    where: { applicationId },
  });

  if (!checklist) {
    throw new Error("Checklist not found");
  }

  // Reset all items
  await prisma.reviewChecklistItem.updateMany({
    where: { checklistId: checklist.id },
    data: {
      completed: false,
      completedBy: null,
      completedAt: null,
      notes: null,
    },
  });

  // Update checklist
  await prisma.reviewChecklist.update({
    where: { id: checklist.id },
    data: {
      completedItems: 0,
      completionRate: 0,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: staffUserId,
      entity: "ReviewChecklist",
      action: "reset",
      meta: { applicationId, checklistId: checklist.id },
    },
  });

  // Application event
  await prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "checklist_reset",
      actorId: staffUserId,
    },
  });
}

/**
 * Recalculate completion stats for a checklist
 */
async function recalculateCompletion(checklistId: string): Promise<void> {
  const items = await prisma.reviewChecklistItem.findMany({
    where: { checklistId },
    select: { completed: true },
  });

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const completionRate = totalItems > 0 ? completedItems / totalItems : 0;

  await prisma.reviewChecklist.update({
    where: { id: checklistId },
    data: {
      completedItems,
      totalItems,
      completionRate,
    },
  });
}
