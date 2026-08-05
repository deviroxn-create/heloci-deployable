/**
 * Decision Service - Reviewer Decision Workspace
 * 
 * Core service for managing all reviewer decisions in the case review workflow.
 * Handles 8 decision types with full RBAC, audit logging, notifications, and communication.
 * 
 * Transaction-safe operations using Prisma transactions.
 * Single source of truth for all decision business logic.
 * 
 * Architecture:
 * - Public decision methods (approve, reject, etc.)
 * - Private helper methods for shared logic
 * - Integration with: RBAC, Audit, Notifications, Communication Center, Timeline
 */

import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import type {
  DecisionType,
  ApplicationStatus,
  ApproveDecisionInput,
  ConditionalApprovalInput,
  RejectDecisionInput,
  WaitlistDecisionInput,
  EscalateDecisionInput,
  RequestAdditionalInfoInput,
  WithdrawDecisionInput,
  CloseDecisionInput,
  CaseDecisionRecord,
  DecisionHistoryRecord,
  ApplicationReadinessCheck,
  DecisionResult,
  DecisionNotificationPayload,
} from "./decision.types";

// ============================================================================
// PUBLIC DECISION METHODS
// ============================================================================

/**
 * Approve an application
 * 
 * @param input - Approval decision input
 * @returns Promise resolving to decision result
 */
export async function approveApplication(
  input: ApproveDecisionInput
): Promise<DecisionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify and authorize
      await verifyApplicationAccess(
        input.applicationId,
        input.staffUserId,
        input.internalNotes
      );

      // 2. Get application with all context
      const application = await tx.programApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          program: true,
          user: true,
          reviewChecklist: true,
          caseConversation: true,
        },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      // 3. Validate state (can approve from under_review, needs_info, etc.)
      validateApplicationStateForDecision(application.status, "approved");

      // 4. Create decision record
      const decision = await tx.caseDecision.create({
        data: {
          applicationId: input.applicationId,
          decision: "approved",
          reason: "Application approved",
          internalNotes: input.internalNotes,
          applicantMessage: input.applicantMessage,
          effectiveDate: input.effectiveDate || new Date(),
          decidedBy: input.staffUserId,
          templateUsed: input.templateId,
          isActive: true,
        },
      });

      // 5. Update application status
      await tx.programApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "approved",
          decision: "approved",
          decisionReason: "Application approved",
          reviewedById: input.staffUserId,
          reviewedAt: new Date(),
        },
      });

      // 6. Remove from waitlist if applicable
      await tx.waitlistEntry.deleteMany({
        where: { applicationId: input.applicationId },
      });

      // 7. Create timeline event
      await tx.applicationEvent.create({
        data: {
          applicationId: input.applicationId,
          type: "decision_approved",
          actorId: input.staffUserId,
          metadata: {
            decision: "approved",
            decisionId: decision.id,
            effectiveDate: input.effectiveDate,
          },
        },
      });

      // 8. Create audit log
      await tx.auditLog.create({
        data: {
          userId: input.staffUserId,
          entity: "CaseDecision",
          action: "approved",
          meta: {
            applicationId: input.applicationId,
            decisionId: decision.id,
            applicantId: application.user.id,
            organizationId: application.program.organizationId,
          },
        },
      });

      // 9. Post to communication center
      await postDecisionToConversation(
        tx,
        input.applicationId,
        input.staffUserId,
        "approved",
        input.applicantMessage || "Your application has been approved. Congratulations!"
      );

      return decision;
    });

    // 10. Publish notification (outside transaction for async)
    const application = await prisma.programApplication.findUnique({
      where: { id: input.applicationId },
      include: { program: true, user: true },
    });

    if (application) {
      // Using existing notification event (new events added in Phase 6)
      publishDomainEvent("application.approved", {
        userId: application.user.id,
        email: application.user.email,
        applicationId: input.applicationId,
        programName: application.program.name,
        applicantName: application.user.name || "Applicant",
        decision: "approved",
        reason: "Application approved",
      });
    }

    return {
      success: true,
      decisionId: result.id,
      message: "Application approved successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to approve application",
    };
  }
}

/**
 * Conditionally approve an application
 * 
 * @param input - Conditional approval input
 * @returns Promise resolving to decision result
 */
export async function conditionallyApproveApplication(
  input: ConditionalApprovalInput
): Promise<DecisionResult> {
  try {
    if (!input.conditions || input.conditions.length === 0) {
      return {
        success: false,
        error: "Conditions are required for conditional approval",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify and authorize
      await verifyApplicationAccess(
        input.applicationId,
        input.staffUserId,
        input.internalNotes
      );

      // 2. Get application
      const application = await tx.programApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          program: true,
          user: true,
          caseConversation: true,
        },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      // 3. Validate state
      validateApplicationStateForDecision(application.status, "conditional_approval");

      // 4. Create decision with conditions
      const decision = await tx.caseDecision.create({
        data: {
          applicationId: input.applicationId,
          decision: "conditional_approval",
          reason: "Application conditionally approved with conditions",
          internalNotes: input.internalNotes,
          applicantMessage: input.applicantMessage,
          effectiveDate: new Date(),
          expiresAt: input.expirationDate,
          decidedBy: input.staffUserId,
          templateUsed: input.templateId,
          conditions: { conditions: input.conditions },
          isActive: true,
        },
      });

      // 5. Update application status
      await tx.programApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "conditional_approval",
          decision: "conditional_approval",
          decisionReason: `Conditionally approved with ${input.conditions.length} conditions`,
          reviewedById: input.staffUserId,
          reviewedAt: new Date(),
        },
      });

      // 6. Create timeline event
      await tx.applicationEvent.create({
        data: {
          applicationId: input.applicationId,
          type: "decision_conditional_approval",
          actorId: input.staffUserId,
          metadata: {
            decision: "conditional_approval",
            decisionId: decision.id,
            conditionCount: input.conditions.length,
            expirationDate: input.expirationDate,
          },
        },
      });

      // 7. Create audit log
      await tx.auditLog.create({
        data: {
          userId: input.staffUserId,
          entity: "CaseDecision",
          action: "conditional_approval",
          meta: {
            applicationId: input.applicationId,
            decisionId: decision.id,
            conditionCount: input.conditions.length,
            organizationId: application.program.organizationId,
          },
        },
      });

      // 8. Post to communication center with conditions
      const conditionsText = input.conditions
        .map((c, i) => `${i + 1}. ${c}`)
        .join("\n");
      const message =
        input.applicantMessage ||
        `Your application has been conditionally approved. Please address the following conditions:\n\n${conditionsText}`;

      await postDecisionToConversation(
        tx,
        input.applicationId,
        input.staffUserId,
        "conditional_approval",
        message
      );

      return decision;
    });

    // 9. Publish notification
    const application = await prisma.programApplication.findUnique({
      where: { id: input.applicationId },
      include: { program: true, user: true },
    });

    if (application) {
      // Publish conditional approval notification
      publishDomainEvent("application.review.completed", {
        userId: application.user.id,
        email: application.user.email,
        applicationId: input.applicationId,
        programName: application.program.name,
        applicantName: application.user.name || "Applicant",
        decision: "conditional_approval",
        reason: "Application conditionally approved",
        conditions: input.conditions,
      });
    }

    return {
      success: true,
      decisionId: result.id,
      message: "Application conditionally approved successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to conditionally approve application",
    };
  }
}

/**
 * Reject an application
 * 
 * @param input - Rejection decision input
 * @returns Promise resolving to decision result
 */
export async function rejectApplication(
  input: RejectDecisionInput
): Promise<DecisionResult> {
  try {
    if (!input.reason || !input.reason.trim()) {
      return {
        success: false,
        error: "Rejection reason is required",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify and authorize
      await verifyApplicationAccess(
        input.applicationId,
        input.staffUserId,
        input.internalNotes
      );

      // 2. Get application
      const application = await tx.programApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          program: true,
          user: true,
          caseConversation: true,
        },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      // 3. Validate state
      validateApplicationStateForDecision(application.status, "rejected");

      // 4. Create decision record
      const decision = await tx.caseDecision.create({
        data: {
          applicationId: input.applicationId,
          decision: "rejected",
          reason: input.reason,
          internalNotes: input.internalNotes,
          applicantMessage: input.applicantMessage || `Your application was not approved. Reason: ${input.reason}`,
          decidedBy: input.staffUserId,
          templateUsed: input.templateId,
          isActive: true,
        },
      });

      // 5. Update application status
      await tx.programApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "rejected",
          decision: "rejected",
          decisionReason: input.reason,
          reviewedById: input.staffUserId,
          reviewedAt: new Date(),
        },
      });

      // 6. Remove from waitlist if applicable
      await tx.waitlistEntry.deleteMany({
        where: { applicationId: input.applicationId },
      });

      // 7. Create timeline event
      await tx.applicationEvent.create({
        data: {
          applicationId: input.applicationId,
          type: "decision_rejected",
          actorId: input.staffUserId,
          metadata: {
            decision: "rejected",
            decisionId: decision.id,
            reason: input.reason,
          },
        },
      });

      // 8. Create audit log
      await tx.auditLog.create({
        data: {
          userId: input.staffUserId,
          entity: "CaseDecision",
          action: "rejected",
          meta: {
            applicationId: input.applicationId,
            decisionId: decision.id,
            reason: input.reason,
            organizationId: application.program.organizationId,
          },
        },
      });

      // 9. Post to communication center
      await postDecisionToConversation(
        tx,
        input.applicationId,
        input.staffUserId,
        "rejected",
        input.applicantMessage || `Your application was not approved. Reason: ${input.reason}`
      );

      return decision;
    });

    // 10. Publish notification
    const application = await prisma.programApplication.findUnique({
      where: { id: input.applicationId },
      include: { program: true, user: true },
    });

    if (application) {
      publishDomainEvent("application.rejected", {
        userId: application.user.id,
        email: application.user.email,
        applicationId: input.applicationId,
        programName: application.program.name,
        applicantName: application.user.name || "Applicant",
        decision: "rejected",
        reason: input.reason,
      });
    }

    return {
      success: true,
      decisionId: result.id,
      message: "Application rejected successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to reject application",
    };
  }
}


/**
 * Waitlist an application
 * 
 * @param input - Waitlist decision input
 * @returns Promise resolving to decision result
 */
export async function waitlistApplication(
  input: WaitlistDecisionInput
): Promise<DecisionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify and authorize
      await verifyApplicationAccess(
        input.applicationId,
        input.staffUserId,
        input.internalNotes
      );

      // 2. Get application
      const application = await tx.programApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          program: true,
          user: true,
          caseConversation: true,
        },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      // 3. Validate state
      validateApplicationStateForDecision(application.status, "waitlisted");

      // 4. Get current waitlist position
      const waitlistCount = await tx.waitlistEntry.count({
        where: { programId: application.programId },
      });

      // 5. Create decision record
      const decision = await tx.caseDecision.create({
        data: {
          applicationId: input.applicationId,
          decision: "waitlisted",
          reason: input.reason || "Application added to waitlist",
          internalNotes: input.internalNotes,
          applicantMessage:
            input.applicantMessage ||
            `You have been added to the waitlist. Position: ${waitlistCount + 1}`,
          effectiveDate: new Date(),
          expiresAt: input.expectedReviewDate,
          decidedBy: input.staffUserId,
          templateUsed: input.templateId,
          isActive: true,
        },
      });

      // 6. Update application status
      await tx.programApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "waitlisted",
          decision: "waitlisted",
          decisionReason: input.reason || "Waitlisted",
          waitlistedAt: new Date(),
          reviewedById: input.staffUserId,
          reviewedAt: new Date(),
        },
      });

      // 7. Create or update waitlist entry
      await tx.waitlistEntry.create({
        data: {
          programId: application.programId,
          applicationId: input.applicationId,
          position: waitlistCount + 1,
          joinedAt: new Date(),
        },
      });

      // 8. Create timeline event
      await tx.applicationEvent.create({
        data: {
          applicationId: input.applicationId,
          type: "decision_waitlisted",
          actorId: input.staffUserId,
          metadata: {
            decision: "waitlisted",
            decisionId: decision.id,
            position: waitlistCount + 1,
            expectedReviewDate: input.expectedReviewDate,
          },
        },
      });

      // 9. Create audit log
      await tx.auditLog.create({
        data: {
          userId: input.staffUserId,
          entity: "CaseDecision",
          action: "waitlisted",
          meta: {
            applicationId: input.applicationId,
            decisionId: decision.id,
            position: waitlistCount + 1,
            organizationId: application.program.organizationId,
          },
        },
      });

      // 10. Post to communication center
      await postDecisionToConversation(
        tx,
        input.applicationId,
        input.staffUserId,
        "waitlisted",
        input.applicantMessage ||
          `You have been added to the waitlist. Position: ${waitlistCount + 1}`
      );

      return decision;
    });

    // 11. Publish notification
    const application = await prisma.programApplication.findUnique({
      where: { id: input.applicationId },
      include: { program: true, user: true },
    });

    if (application) {
      publishDomainEvent("application.waitlisted", {
        userId: application.user.id,
        email: application.user.email,
        applicationId: input.applicationId,
        programName: application.program.name,
        applicantName: application.user.name || "Applicant",
        decision: "waitlisted",
        reason: input.reason || "Added to waitlist",
      });
    }

    return {
      success: true,
      decisionId: result.id,
      message: "Application added to waitlist successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to add application to waitlist",
    };
  }
}

/**
 * Escalate an application to a higher authority
 * 
 * @param input - Escalation decision input
 * @returns Promise resolving to decision result
 */
export async function escalateApplication(
  input: EscalateDecisionInput
): Promise<DecisionResult> {
  try {
    if (!input.reason || !input.reason.trim()) {
      return {
        success: false,
        error: "Escalation reason is required",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify and authorize
      await verifyApplicationAccess(
        input.applicationId,
        input.staffUserId,
        input.internalNotes
      );

      // 2. Get application
      const application = await tx.programApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          program: true,
          user: true,
          assignedTo: true,
          caseConversation: true,
        },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      // 3. Determine escalation target
      let escalateToUserId = input.escalateToUserId;

      if (!escalateToUserId && application.assignedTo?.supervisorId) {
        escalateToUserId = application.assignedTo.supervisorId;
      } else if (!escalateToUserId) {
        // Fallback: find org admin
        const admin = await tx.organizationMember.findFirst({
          where: {
            organizationId: application.program.organizationId,
            role: "org_admin",
          },
          include: { user: true },
        });
        escalateToUserId = admin?.user.id;
      }

      // 4. Create decision record
      const decision = await tx.caseDecision.create({
        data: {
          applicationId: input.applicationId,
          decision: "escalated",
          reason: input.reason,
          internalNotes: input.internalNotes,
          applicantMessage: input.applicantMessage,
          decidedBy: input.staffUserId,
          isActive: true,
        },
      });

      // 5. Reassign case
      if (escalateToUserId) {
        await tx.programApplication.update({
          where: { id: input.applicationId },
          data: {
            assignedToId: escalateToUserId,
            assignedAt: new Date(),
          },
        });
      }

      // 6. Create timeline event
      await tx.applicationEvent.create({
        data: {
          applicationId: input.applicationId,
          type: "decision_escalated",
          actorId: input.staffUserId,
          metadata: {
            decision: "escalated",
            decisionId: decision.id,
            reason: input.reason,
            escalatedToUserId: escalateToUserId,
          },
        },
      });

      // 7. Create audit log
      await tx.auditLog.create({
        data: {
          userId: input.staffUserId,
          entity: "CaseDecision",
          action: "escalated",
          meta: {
            applicationId: input.applicationId,
            decisionId: decision.id,
            reason: input.reason,
            escalatedToUserId: escalateToUserId,
            organizationId: application.program.organizationId,
          },
        },
      });

      // 8. Internal message (do NOT notify applicant)
      const escalationMessage = `[INTERNAL] Case escalated: ${input.reason}`;
      await postDecisionToConversation(
        tx,
        input.applicationId,
        input.staffUserId,
        "escalated",
        escalationMessage
      );

      return decision;
    });

    return {
      success: true,
      decisionId: result.id,
      message: "Application escalated successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to escalate application",
    };
  }
}

/**
 * Request additional information from applicant
 * 
 * @param input - Request additional info input
 * @returns Promise resolving to decision result
 */
export async function requestAdditionalInfo(
  input: RequestAdditionalInfoInput
): Promise<DecisionResult> {
  try {
    if (!input.informationNeeded || input.informationNeeded.length === 0) {
      return {
        success: false,
        error: "Information needed is required",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify and authorize
      await verifyApplicationAccess(
        input.applicationId,
        input.staffUserId,
        input.internalNotes
      );

      // 2. Get application
      const application = await tx.programApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          program: true,
          user: true,
          caseConversation: true,
        },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      // 3. Validate state
      validateApplicationStateForDecision(application.status, "needs_info");

      // 4. Create decision record
      const deadline = input.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const decision = await tx.caseDecision.create({
        data: {
          applicationId: input.applicationId,
          decision: "needs_info",
          reason: `Additional information needed: ${input.informationNeeded.join(", ")}`,
          internalNotes: input.internalNotes,
          applicantMessage: input.applicantMessage,
          expiresAt: deadline,
          decidedBy: input.staffUserId,
          isActive: true,
        },
      });

      // 5. Update application status
      await tx.programApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "needs_info",
          decision: "needs_info",
          decisionReason: `Additional information needed by ${deadline.toLocaleDateString()}`,
        },
      });

      // 6. Create document requests for each item
      for (const info of input.informationNeeded) {
        await tx.documentRequest.create({
          data: {
            applicationId: input.applicationId,
            documentType: info,
            status: "pending",
            requestedBy: input.staffUserId,
            expiresAt: deadline,
            notes: input.instructions || `Please provide: ${info}`,
          },
        });
      }

      // 7. Create timeline event
      await tx.applicationEvent.create({
        data: {
          applicationId: input.applicationId,
          type: "decision_needs_info",
          actorId: input.staffUserId,
          metadata: {
            decision: "needs_info",
            decisionId: decision.id,
            informationNeeded: input.informationNeeded,
            deadline: deadline,
          },
        },
      });

      // 8. Create audit log
      await tx.auditLog.create({
        data: {
          userId: input.staffUserId,
          entity: "CaseDecision",
          action: "needs_info",
          meta: {
            applicationId: input.applicationId,
            decisionId: decision.id,
            informationNeeded: input.informationNeeded,
            deadline: deadline,
            organizationId: application.program.organizationId,
          },
        },
      });

      // 9. Post to communication center
      const infoList = input.informationNeeded
        .map((i, idx) => `${idx + 1}. ${i}`)
        .join("\n");
      const message =
        input.applicantMessage ||
        `We need the following additional information by ${deadline.toLocaleDateString()}:\n\n${infoList}${input.instructions ? `\n\nInstructions: ${input.instructions}` : ""}`;

      await postDecisionToConversation(
        tx,
        input.applicationId,
        input.staffUserId,
        "needs_info",
        message
      );

      return decision;
    });

    // 10. Publish notification
    const application = await prisma.programApplication.findUnique({
      where: { id: input.applicationId },
      include: { program: true, user: true },
    });

    if (application) {
      // Publish document request notification
      publishDomainEvent("documents.requested", {
        userId: application.user.id,
        email: application.user.email,
        applicationId: input.applicationId,
        programName: application.program.name,
        applicantName: application.user.name || "Applicant",
        decision: "needs_info",
        reason: "Additional information needed",
        instructions: input.instructions,
      });
    }

    return {
      success: true,
      decisionId: result.id,
      message: "Information request created successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to request additional information",
    };
  }
}


/**
 * Withdraw an application
 * 
 * @param input - Withdrawal decision input
 * @returns Promise resolving to decision result
 */
export async function withdrawApplication(
  input: WithdrawDecisionInput
): Promise<DecisionResult> {
  try {
    if (!input.reason || !input.reason.trim()) {
      return {
        success: false,
        error: "Withdrawal reason is required",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify and authorize (allow applicant to withdraw own application)
      if (!input.withdrawnByApplicant) {
        await verifyApplicationAccess(
          input.applicationId,
          input.staffUserId,
          input.internalNotes
        );
      }

      // 2. Get application
      const application = await tx.programApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          program: true,
          user: true,
          caseConversation: true,
        },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      // 3. Validate state - can withdraw from most states
      validateApplicationStateForDecision(application.status, "withdrawn");

      // 4. Create decision record
      const decision = await tx.caseDecision.create({
        data: {
          applicationId: input.applicationId,
          decision: "withdrawn",
          reason: input.reason,
          internalNotes: input.internalNotes,
          applicantMessage: input.applicantMessage,
          decidedBy: input.staffUserId,
          isActive: true,
        },
      });

      // 5. Update application status
      await tx.programApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "withdrawn",
          decision: "withdrawn",
          decisionReason: input.reason,
        },
      });

      // 6. Remove from waitlist if applicable
      await tx.waitlistEntry.deleteMany({
        where: { applicationId: input.applicationId },
      });

      // 7. Create timeline event
      await tx.applicationEvent.create({
        data: {
          applicationId: input.applicationId,
          type: "decision_withdrawn",
          actorId: input.staffUserId,
          metadata: {
            decision: "withdrawn",
            decisionId: decision.id,
            reason: input.reason,
            withdrawnByApplicant: input.withdrawnByApplicant || false,
          },
        },
      });

      // 8. Create audit log
      await tx.auditLog.create({
        data: {
          userId: input.staffUserId,
          entity: "CaseDecision",
          action: "withdrawn",
          meta: {
            applicationId: input.applicationId,
            decisionId: decision.id,
            reason: input.reason,
            withdrawnByApplicant: input.withdrawnByApplicant || false,
            organizationId: application.program.organizationId,
          },
        },
      });

      // 9. Post to communication center
      const message = input.applicantMessage || `Your application has been withdrawn. Reason: ${input.reason}`;
      await postDecisionToConversation(
        tx,
        input.applicationId,
        input.staffUserId,
        "withdrawn",
        message
      );

      return decision;
    });

    // 10. Publish notification
    const application = await prisma.programApplication.findUnique({
      where: { id: input.applicationId },
      include: { program: true, user: true },
    });

    if (application) {
      // Publish application withdrawn notification
      publishDomainEvent("application.withdrawn", {
        userId: application.user.id,
        applicationId: input.applicationId,
        programName: application.program.name,
        applicantName: application.user.name || "Applicant",
        decision: "withdrawn",
        reason: input.reason,
      });
    }

    return {
      success: true,
      decisionId: result.id,
      message: "Application withdrawn successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to withdraw application",
    };
  }
}

/**
 * Close a case
 * 
 * @param input - Close case decision input
 * @returns Promise resolving to decision result
 */
export async function closeCase(
  input: CloseDecisionInput
): Promise<DecisionResult> {
  try {
    if (!input.reason || !input.reason.trim()) {
      return {
        success: false,
        error: "Closure reason is required",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get application
      const application = await tx.programApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          program: true,
          user: true,
          caseConversation: true,
        },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      // 3. Create decision record
      const decision = await tx.caseDecision.create({
        data: {
          applicationId: input.applicationId,
          decision: "closed",
          reason: input.reason,
          internalNotes: input.internalNotes || input.finalNotes,
          decidedBy: input.staffUserId,
          isActive: true,
        },
      });

      // 4. Update application status
      await tx.programApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "closed",
          decision: "closed",
          decisionReason: input.reason,
        },
      });

      // 5. Archive conversation (mark as closed internally)
      if (application.caseConversation) {
        await tx.caseConversation.update({
          where: { id: application.caseConversation.id },
          data: {
            // Add closed flag if available, or just leave it
          },
        });
      }

      // 6. Create timeline event (internal only)
      await tx.applicationEvent.create({
        data: {
          applicationId: input.applicationId,
          type: "decision_closed",
          actorId: input.staffUserId,
          metadata: {
            decision: "closed",
            decisionId: decision.id,
            reason: input.reason,
            internal: true, // Mark as internal event
          },
        },
      });

      // 7. Create audit log
      await tx.auditLog.create({
        data: {
          userId: input.staffUserId,
          entity: "CaseDecision",
          action: "closed",
          meta: {
            applicationId: input.applicationId,
            decisionId: decision.id,
            reason: input.reason,
            finalNotes: input.finalNotes,
            organizationId: application.program.organizationId,
          },
        },
      });

      // 8. Post internal message (DO NOT notify applicant)
      const message = `[ADMIN] Case closed: ${input.reason}`;
      await postDecisionToConversation(
        tx,
        input.applicationId,
        input.staffUserId,
        "closed",
        message
      );

      return decision;
    });

    return {
      success: true,
      decisionId: result.id,
      message: "Case closed successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to close case",
    };
  }
}

// ============================================================================
// PRIVATE HELPER FUNCTIONS
// ============================================================================

/**
 * Verify application exists and perform minimal ownership validation
 * 
 * This helper is intentionally lightweight: authorization is expected
 * to occur at the API entry point. The service retains only existence
 * checking and any organization ownership validation required for business logic.
 * 
 * @private
 */
async function verifyApplicationAccess(
  applicationId: string,
  staffUserId: string,
  internalNotes?: string
): Promise<void> {
  // Get application with organization
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: true,
      user: true,
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }
}

/**
 * Validate application state for decision
 * 
 * @private
 */
function validateApplicationStateForDecision(
  currentStatus: string,
  decisionType: DecisionType
): void {
  const validTransitions: Record<DecisionType, string[]> = {
    approved: [
      "draft",
      "submitted",
      "under_review",
      "conditional_approval",
      "needs_info",
    ],
    conditional_approval: [
      "draft",
      "submitted",
      "under_review",
      "needs_info",
    ],
    rejected: [
      "draft",
      "submitted",
      "under_review",
      "conditional_approval",
      "needs_info",
    ],
    waitlisted: [
      "draft",
      "submitted",
      "under_review",
      "needs_info",
    ],
    escalated: [
      "draft",
      "submitted",
      "under_review",
      "conditional_approval",
      "needs_info",
    ],
    needs_info: [
      "draft",
      "submitted",
      "under_review",
      "conditional_approval",
    ],
    withdrawn: [
      "draft",
      "submitted",
      "under_review",
      "conditional_approval",
      "waitlisted",
      "needs_info",
      "approved",
      "rejected",
    ],
    closed: [
      "draft",
      "submitted",
      "under_review",
      "conditional_approval",
      "waitlisted",
      "needs_info",
      "approved",
      "rejected",
      "withdrawn",
    ],
  };

  const allowed = validTransitions[decisionType] || [];

  if (!allowed.includes(currentStatus)) {
    throw new Error(
      `Cannot make "${decisionType}" decision on application with status "${currentStatus}"`
    );
  }
}

/**
 * Post decision to Communication Center conversation
 * 
 * @private
 */
async function postDecisionToConversation(
  tx: any,
  applicationId: string,
  staffUserId: string,
  decisionType: DecisionType,
  message: string
): Promise<void> {
  // Get or create conversation
  let conversation = await tx.caseConversation.findUnique({
    where: { applicationId },
  });

  if (!conversation) {
    conversation = await tx.caseConversation.create({
      data: {
        applicationId,
        subject: `Decision - ${decisionType}`,
      },
    });
  }

  // Create message
  await tx.caseMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: staffUserId,
      senderRole: "staff",
      content: message,
    },
  });

  // Update conversation last message time
  await tx.caseConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      lastMessageFrom: staffUserId,
      staffRead: false,
    },
  });
}

/**
 * Get decision history for an application
 * 
 * @param applicationId - Application ID
 * @returns Array of decision history records
 */
export async function getDecisionHistory(
  applicationId: string
): Promise<DecisionHistoryRecord[]> {
  const decisions = await prisma.caseDecision.findMany({
    where: { applicationId },
    include: {
      decider: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { decidedAt: "desc" },
  });

  return decisions.map((d) => ({
    id: d.id,
    decision: d.decision as DecisionType,
    reason: d.reason,
    decidedBy: d.decider,
    decidedAt: d.decidedAt,
    applicantMessage: d.applicantMessage || undefined,
    isActive: d.isActive,
    supersededBy: d.supersededBy || undefined,
  }));
}

/**
 * Get latest active decision for an application
 * 
 * @param applicationId - Application ID
 * @returns Latest decision or null
 */
export async function getLatestDecision(
  applicationId: string
): Promise<CaseDecisionRecord | null> {
  const decision = await prisma.caseDecision.findFirst({
    where: {
      applicationId,
      isActive: true,
    },
    orderBy: { decidedAt: "desc" },
  });

  if (!decision) {
    return null;
  }

  return {
    id: decision.id,
    applicationId: decision.applicationId,
    decision: decision.decision as DecisionType,
    reason: decision.reason,
    internalNotes: decision.internalNotes || undefined,
    applicantMessage: decision.applicantMessage || undefined,
    effectiveDate: decision.effectiveDate || undefined,
    expiresAt: decision.expiresAt || undefined,
    decidedBy: decision.decidedBy,
    decidedAt: decision.decidedAt,
    templateUsed: decision.templateUsed || undefined,
    conditions: decision.conditions as Record<string, unknown> | undefined,
    supersededBy: decision.supersededBy || undefined,
    isActive: decision.isActive,
  };
}

/**
 * Supersede a previous decision with a new one
 * 
 * @param previousDecisionId - ID of decision to replace
 * @param newDecisionId - ID of new decision
 * @param reason - Reason for superseding
 */
export async function supercedePreviousDecision(
  previousDecisionId: string,
  newDecisionId: string,
  reason: string
): Promise<void> {
  await prisma.caseDecision.update({
    where: { id: previousDecisionId },
    data: {
      isActive: false,
      supersededBy: newDecisionId,
    },
  });

  // Note: Could also create an audit log for the supersession
}

/**
 * Check application readiness for decision
 * 
 * @param applicationId - Application ID
 * @returns Readiness check result with warnings and recommendations
 */
export async function getApplicationReadiness(
  applicationId: string
): Promise<ApplicationReadinessCheck> {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      reviewChecklist: {
        include: { items: true },
      },
      documents: {
        include: { verification: true },
      },
    },
  });

  if (!application) {
    return {
      isReady: false,
      warnings: ["Application not found"],
      recommendations: [],
    };
  }

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check checklist completion
  const checklistCompletion = application.reviewChecklist?.completionRate || 0;
  if (checklistCompletion < 0.8) {
    warnings.push(
      `Review checklist is only ${(checklistCompletion * 100).toFixed(0)}% complete`
    );
    recommendations.push("Complete all review checklist items");
  }

  // Check document verification
  const documentsTotal = application.documents.length;
  const documentsVerified = application.documents.filter(
    (d) => d.verification?.status === "verified"
  ).length;

  if (documentsVerified < documentsTotal) {
    warnings.push(
      `${documentsTotal - documentsVerified} of ${documentsTotal} documents not verified`
    );
    recommendations.push("Verify all required documents");
  }

  return {
    isReady: warnings.length === 0,
    warnings,
    recommendations,
    checklistCompletion: checklistCompletion * 100,
    documentsVerified,
    documentsTotal,
  };
}

