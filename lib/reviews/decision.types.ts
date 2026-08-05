/**
 * Reviewer Decision Workspace - Type Definitions
 * 
 * Defines all types and interfaces for the decision service layer.
 * Used across decision workflows, API routes, and UI components.
 */

/**
 * Valid decision types that a reviewer can make
 */
export type DecisionType = 
  | "approved"
  | "conditional_approval"
  | "rejected"
  | "waitlisted"
  | "escalated"
  | "needs_info"
  | "withdrawn"
  | "closed";

/**
 * Application status values (subset for decision context)
 */
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "withdrawn"
  | "closed"
  | "conditional_approval"
  | "needs_info";

/**
 * Required RBAC roles for making decisions
 */
export type DecisionMakerRole = "org_admin" | "reviewer" | "case_worker";

/**
 * Common input parameters for all decision operations
 */
export interface BaseDecisionInput {
  applicationId: string;
  staffUserId: string;
  internalNotes?: string;
}

/**
 * Input for approval decision
 */
export interface ApproveDecisionInput extends BaseDecisionInput {
  effectiveDate?: Date;
  applicantMessage?: string;
  templateId?: string;
}

/**
 * Input for conditional approval decision
 */
export interface ConditionalApprovalInput extends BaseDecisionInput {
  conditions: string[]; // Array of condition strings or JSON
  expirationDate?: Date;
  applicantMessage: string; // Required for conditional
  templateId?: string;
}

/**
 * Input for rejection decision
 */
export interface RejectDecisionInput extends BaseDecisionInput {
  reason: string; // Required - why was it rejected
  applicantMessage?: string;
  templateId?: string;
}

/**
 * Input for waitlist decision
 */
export interface WaitlistDecisionInput extends BaseDecisionInput {
  reason?: string;
  expectedReviewDate?: Date;
  applicantMessage?: string;
  templateId?: string;
}

/**
 * Input for escalation decision
 */
export interface EscalateDecisionInput extends BaseDecisionInput {
  reason: string; // Required - why escalate
  escalateToUserId?: string; // Optional - defaults to supervisor
  applicantMessage?: string;
}

/**
 * Input for requesting additional information
 */
export interface RequestAdditionalInfoInput extends BaseDecisionInput {
  informationNeeded: string[]; // What info is needed
  deadline?: Date; // Optional - defaults to 7 days from now
  instructions?: string; // Instructions for applicant
  applicantMessage?: string;
  templateId?: string;
}

/**
 * Input for withdrawal decision
 */
export interface WithdrawDecisionInput extends BaseDecisionInput {
  reason: string; // Required - why withdrawn
  applicantMessage?: string;
  withdrawnByApplicant?: boolean; // If true, applicant initiated
}

/**
 * Input for closing case
 */
export interface CloseDecisionInput extends BaseDecisionInput {
  reason: string; // Required - why closed
  finalNotes?: string;
}

/**
 * Persisted decision record
 */
export interface CaseDecisionRecord {
  id: string;
  applicationId: string;
  decision: DecisionType;
  reason: string;
  internalNotes?: string;
  applicantMessage?: string;
  effectiveDate?: Date;
  expiresAt?: Date;
  decidedBy: string;
  decidedAt: Date;
  templateUsed?: string;
  conditions?: Record<string, unknown>; // For conditional approvals
  supersededBy?: string;
  isActive: boolean;
}

/**
 * Decision history record
 */
export interface DecisionHistoryRecord {
  id: string;
  decision: DecisionType;
  reason: string;
  decidedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  decidedAt: Date;
  applicantMessage?: string;
  isActive: boolean;
  supersededBy?: string; // If this decision was replaced
}

/**
 * Application readiness check result
 */
export interface ApplicationReadinessCheck {
  isReady: boolean;
  warnings: string[];
  recommendations: string[];
  checklistCompletion?: number;
  documentsVerified?: number;
  documentsTotal?: number;
}

/**
 * Decision template structure
 */
export interface DecisionTemplate {
  id: string;
  organizationId: string;
  name: string;
  category: DecisionType;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
}

/**
 * Notification event payload for decisions
 */
export interface DecisionNotificationPayload {
  userId: string;
  applicationId: string;
  programName: string;
  applicantName: string;
  decision: DecisionType;
  reason: string;
  conditions?: string[]; // For conditional approval
  deadline?: Date; // For needs_info
  instructions?: string;
  appealInformation?: string;
  nextSteps?: string;
}

/**
 * Timeline event data for decisions
 */
export interface DecisionTimelineEvent {
  type: string; // decision_approved, decision_rejected, etc.
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

/**
 * Audit log data for decisions
 */
export interface DecisionAuditLog {
  entity: string; // "CaseDecision"
  action: string; // "approved", "rejected", etc.
  meta: Record<string, unknown>;
}

/**
 * Result of a decision operation
 */
export interface DecisionResult {
  success: boolean;
  decisionId?: string;
  error?: string;
  message?: string;
}
