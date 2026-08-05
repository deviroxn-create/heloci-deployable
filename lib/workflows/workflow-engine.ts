import jsonLogic from "json-logic-js";
import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { getAllDomainEvents } from "@/lib/communications/communication-registry";
import { addApplicationToWaitlist } from "@/lib/workflows/waitlist-service";

export type WorkflowTriggerAction =
  | "notify_applicant"
  | "request_documents"
  | "assign_reviewer"
  | "add_to_waitlist"
  | "create_event"
  | "auto_reject"
  | "auto_approve";

export interface WorkflowTriggerInput {
  name: string;
  event: string;
  condition?: unknown;
  action: WorkflowTriggerAction;
  actionConfig?: Record<string, unknown>;
  isActive?: boolean;
  order?: number;
}

export interface WorkflowPayload {
  applicationId?: string;
  userId?: string;
  programId?: string;
  programName?: string;
  event?: string;
  actorId?: string;
  [key: string]: unknown;
}

export async function listWorkflowTriggers(programId: string) {
  return prisma.workflowTrigger.findMany({
    where: { programId },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }]
  });
}

export async function createWorkflowTrigger(programId: string, staffUserId: string, input: WorkflowTriggerInput) {
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) {
    throw new Error("program_not_found");
  }

  // Authorization must be enforced at API / server-action layer; service validates ownership only.

  const trigger = await prisma.workflowTrigger.create({
    data: {
      programId,
      name: input.name,
      event: input.event,
      condition: input.condition as any,
      action: input.action,
      actionConfig: input.actionConfig ?? ({} as any),
      isActive: input.isActive ?? true,
      order: input.order ?? 0
    }
  });

  await prisma.programEvent.create({
    data: {
      programId,
      type: "workflow_trigger_created",
      actorId: staffUserId,
      metadata: {
        triggerId: trigger.id,
        name: trigger.name,
        event: trigger.event,
        action: trigger.action
      }
    }
  });

  return trigger;
}

function evaluateWorkflowCondition(condition: unknown, payload: WorkflowPayload) {
  if (condition == null) {
    return true;
  }

  try {
    return Boolean(jsonLogic.apply(condition, payload));
  } catch {
    return false;
  }
}

export async function runProgramWorkflows(programId: string, event: string, payload: WorkflowPayload = {}) {
  const triggers = await prisma.workflowTrigger.findMany({
    where: { programId, event, isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }]
  });

  const executed: string[] = [];

  for (const trigger of triggers) {
    const conditionMet = evaluateWorkflowCondition(trigger.condition, payload);
    if (!conditionMet) {
      continue;
    }

    try {
      await executeWorkflowAction(trigger as any, payload);
      executed.push(trigger.id);
    } catch (error) {
      console.error("Workflow trigger failed", { triggerId: trigger.id, error });
    }
  }

  return executed;
}

async function executeWorkflowAction(trigger: { id: string; action: WorkflowTriggerAction; actionConfig: Record<string, unknown>; programId: string }, payload: WorkflowPayload) {
  const applicationId = payload.applicationId as string | undefined;
  const actorId = (payload.actorId as string) ?? (payload.userId as string);
  const program = trigger.programId
    ? await prisma.program.findUnique({ where: { id: trigger.programId } })
    : null;
  const application = applicationId
    ? await prisma.programApplication.findUnique({ where: { id: applicationId }, include: { user: true, program: true } })
    : null;
  const auditActorId = actorId ?? application?.program?.createdBy ?? application?.userId ?? program?.createdBy;

  if (trigger.action === "notify_applicant") {
    // PHASE B.6 CANONICALIZATION FIX:
    // Previously accepted arbitrary event names from trigger config with blind transformation:
    //   eventName.replace(/_/g, ".")
    // This allowed ANY event name to be published, bypassing registry validation.
    //
    // Now we validate against the registry. Only predefined domain events can be published.
    // If a trigger needs a new event, it must be added to the registry first.
    
    const defaultEventName = "admin.action"; // Safe default
    let eventName = (trigger.actionConfig?.notificationEvent as string) ?? defaultEventName;
    
    // Normalize underscores to dots if needed (support legacy config format)
    const normalizedEventName = eventName.replace(/_/g, ".");
    
    // Validate against registry - only allow registered domain events
    const validDomainEvents = getAllDomainEvents();
    if (!validDomainEvents.includes(normalizedEventName)) {
      console.warn(
        `[WorkflowEngine] Trigger ${trigger.id} references unregistered domain event: ${normalizedEventName}. ` +
        `Falling back to default: ${defaultEventName}. ` +
        `To use this event, add it to Communication Registry first.`
      );
      eventName = defaultEventName;
    } else {
      eventName = normalizedEventName;
    }

    publishDomainEvent(eventName, {
      ...payload,
      recipientEmail: application?.user?.email as string | undefined,
      programName: application?.program?.name ?? program?.name,
      locale: "en",
    });
  }

  if (trigger.action === "request_documents" && applicationId) {
    const documentTypes = (trigger.actionConfig?.documentTypes as string[]) ?? [];

    if (documentTypes.length) {
      await Promise.all(
        documentTypes.map((documentType) =>
          prisma.documentRequest.create({
            data: {
              applicationId,
              documentType,
              requestedBy: auditActorId ?? application?.userId ?? undefined,
              notes: (trigger.actionConfig?.notes as string) ?? "",
              requestedAt: new Date()
            }
          })
        )
      );

      publishDomainEvent("documents.requested", {
        ...payload,
        applicationId,
        programName: application?.program?.name,
        recipientEmail: application?.user?.email as string | undefined,
        locale: "en",
        requestedDocs: documentTypes,
      });
      }
  }

  if (trigger.action === "assign_reviewer" && applicationId) {
    const assignedToUserId = trigger.actionConfig?.assignedToUserId as string | undefined;
    if (assignedToUserId) {
      await prisma.programApplication.update({ where: { id: applicationId }, data: { assignedToId: assignedToUserId } });
      publishDomainEvent("admin.action", {
        ...payload,
        userId: assignedToUserId,
        recipientEmail: payload.recipientEmail as string | undefined,
        locale: "en",
        applicationId,
        programName: application?.program?.name,
      });
    }
  }

  if (trigger.action === "add_to_waitlist" && applicationId) {
    await addApplicationToWaitlist(applicationId, auditActorId ?? application?.userId, trigger.actionConfig?.reason as string | undefined);
  }

  if (trigger.action === "auto_reject" && applicationId) {
    await prisma.programApplication.update({ where: { id: applicationId }, data: { status: "rejected", decision: "rejected", decisionReason: trigger.actionConfig?.reason as string ?? "Auto rejected by rule" } });
    publishDomainEvent("application.rejected", {
      ...payload,
      applicationId,
      programName: application?.program?.name,
      recipientEmail: application?.user?.email as string | undefined,
      locale: "en",
      reason: trigger.actionConfig?.reason,
    });
  }

  if (trigger.action === "auto_approve" && applicationId) {
    await prisma.programApplication.update({ where: { id: applicationId }, data: { status: "approved", decision: "approved", decisionReason: trigger.actionConfig?.reason as string ?? "Auto approved by rule" } });
    publishDomainEvent("application.approved", {
      ...payload,
      applicationId,
      programName: application?.program?.name,
      recipientEmail: application?.user?.email as string | undefined,
      locale: "en",
      reason: trigger.actionConfig?.reason,
    });
  }

  if (applicationId) {
    await prisma.applicationEvent.create({
      data: {
        applicationId,
        type: "workflow_action",
        actorId: auditActorId ?? application?.userId ?? "",
        metadata: {
          triggerId: trigger.id,
          action: trigger.action as any,
          actionConfig: trigger.actionConfig as any,
          payload: payload as any
        } as any
      }
    });
  }
}
