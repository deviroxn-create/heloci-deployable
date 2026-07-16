"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorkflowTriggers = listWorkflowTriggers;
exports.createWorkflowTrigger = createWorkflowTrigger;
exports.runProgramWorkflows = runProgramWorkflows;
const json_logic_js_1 = __importDefault(require("json-logic-js"));
const client_1 = require("@/lib/prisma/client");
const notification_service_1 = require("@/lib/notifications/notification.service");
const rbac_1 = require("@/lib/auth/rbac");
const waitlist_service_1 = require("@/lib/workflows/waitlist-service");
async function listWorkflowTriggers(programId) {
    return client_1.prisma.workflowTrigger.findMany({
        where: { programId },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }]
    });
}
async function createWorkflowTrigger(programId, staffUserId, input) {
    const program = await client_1.prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
        throw new Error("program_not_found");
    }
    await (0, rbac_1.requireOrgRole)(staffUserId, program.organizationId, ["org_admin"]);
    const trigger = await client_1.prisma.workflowTrigger.create({
        data: {
            programId,
            name: input.name,
            event: input.event,
            condition: input.condition,
            action: input.action,
            actionConfig: input.actionConfig ?? {},
            isActive: input.isActive ?? true,
            order: input.order ?? 0
        }
    });
    await client_1.prisma.programEvent.create({
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
function evaluateWorkflowCondition(condition, payload) {
    if (condition == null) {
        return true;
    }
    try {
        return Boolean(json_logic_js_1.default.apply(condition, payload));
    }
    catch {
        return false;
    }
}
async function runProgramWorkflows(programId, event, payload = {}) {
    const triggers = await client_1.prisma.workflowTrigger.findMany({
        where: { programId, event, isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
    });
    const executed = [];
    for (const trigger of triggers) {
        const conditionMet = evaluateWorkflowCondition(trigger.condition, payload);
        if (!conditionMet) {
            continue;
        }
        try {
            await executeWorkflowAction(trigger, payload);
            executed.push(trigger.id);
        }
        catch (error) {
            console.error("Workflow trigger failed", { triggerId: trigger.id, error });
        }
    }
    return executed;
}
async function executeWorkflowAction(trigger, payload) {
    const applicationId = payload.applicationId;
    const actorId = payload.actorId ?? payload.userId;
    const program = trigger.programId
        ? await client_1.prisma.program.findUnique({ where: { id: trigger.programId } })
        : null;
    const application = applicationId
        ? await client_1.prisma.programApplication.findUnique({ where: { id: applicationId }, include: { user: true, program: true } })
        : null;
    const auditActorId = actorId ?? application?.program?.createdBy ?? application?.userId ?? program?.createdBy;
    if (trigger.action === "notify_applicant") {
        const eventName = trigger.actionConfig?.notificationEvent ?? "admin_action";
        await notification_service_1.notificationService.notify(eventName, {
            ...payload,
            recipientEmail: application?.user?.email,
            programName: application?.program?.name ?? program?.name,
            locale: "en"
        });
    }
    if (trigger.action === "request_documents" && applicationId) {
        const documentTypes = trigger.actionConfig?.documentTypes ?? [];
        if (documentTypes.length) {
            await Promise.all(documentTypes.map((documentType) => client_1.prisma.documentRequest.create({
                data: {
                    applicationId,
                    documentType,
                    requestedBy: auditActorId ?? application?.userId ?? undefined,
                    notes: trigger.actionConfig?.notes ?? "",
                    requestedAt: new Date()
                }
            })));
            await notification_service_1.notificationService.notify("documents_requested", {
                ...payload,
                applicationId,
                programName: application?.program?.name,
                recipientEmail: application?.user?.email,
                locale: "en",
                requestedDocs: documentTypes
            });
        }
    }
    if (trigger.action === "assign_reviewer" && applicationId) {
        const assignedToUserId = trigger.actionConfig?.assignedToUserId;
        if (assignedToUserId) {
            await client_1.prisma.programApplication.update({ where: { id: applicationId }, data: { assignedToId: assignedToUserId } });
            await notification_service_1.notificationService.notify("admin_action", {
                ...payload,
                userId: assignedToUserId,
                recipientEmail: payload.recipientEmail,
                locale: "en",
                applicationId,
                programName: application?.program?.name
            });
        }
    }
    if (trigger.action === "add_to_waitlist" && applicationId) {
        await (0, waitlist_service_1.addApplicationToWaitlist)(applicationId, auditActorId ?? application?.userId, trigger.actionConfig?.reason);
    }
    if (trigger.action === "auto_reject" && applicationId) {
        await client_1.prisma.programApplication.update({ where: { id: applicationId }, data: { status: "rejected", decision: "rejected", decisionReason: trigger.actionConfig?.reason ?? "Auto rejected by rule" } });
        await notification_service_1.notificationService.notify("application_rejected", {
            ...payload,
            applicationId,
            programName: application?.program?.name,
            recipientEmail: application?.user?.email,
            locale: "en",
            reason: trigger.actionConfig?.reason
        });
    }
    if (trigger.action === "auto_approve" && applicationId) {
        await client_1.prisma.programApplication.update({ where: { id: applicationId }, data: { status: "approved", decision: "approved", decisionReason: trigger.actionConfig?.reason ?? "Auto approved by rule" } });
        await notification_service_1.notificationService.notify("application_approved", {
            ...payload,
            applicationId,
            programName: application?.program?.name,
            recipientEmail: application?.user?.email,
            locale: "en",
            reason: trigger.actionConfig?.reason
        });
    }
    if (applicationId) {
        await client_1.prisma.applicationEvent.create({
            data: {
                applicationId,
                type: "workflow_action",
                actorId: auditActorId ?? application?.userId ?? "",
                metadata: {
                    triggerId: trigger.id,
                    action: trigger.action,
                    actionConfig: trigger.actionConfig,
                    payload: payload
                }
            }
        });
    }
}
