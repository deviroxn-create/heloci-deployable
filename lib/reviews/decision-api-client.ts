/**
 * Decision API Client
 * 
 * Provides type-safe wrapper functions for calling the Decision API endpoints.
 * Used by UI components to make decisions, fetch history, and check readiness.
 */

import type {
  DecisionType,
  DecisionHistoryRecord,
  ApplicationReadinessCheck,
  ApproveDecisionInput,
  ConditionalApprovalInput,
  RejectDecisionInput,
  WaitlistDecisionInput,
  EscalateDecisionInput,
  RequestAdditionalInfoInput,
  WithdrawDecisionInput,
  CloseDecisionInput,
} from "./decision.types";

/**
 * Standard API response format
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Decision result type
 */
interface DecisionOperationResult {
  decisionId?: string;
  decisionType?: DecisionType;
  message?: string;
}

/**
 * Make an approval decision
 */
export async function apiApproveApplication(
  applicationId: string,
  input: Omit<ApproveDecisionInput, "applicationId">
): Promise<ApiResponse<DecisionOperationResult>> {
  return fetch(`/api/cases/${applicationId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionType: "approved",
      ...input,
    }),
  }).then((r) => r.json());
}

/**
 * Make a conditional approval decision
 */
export async function apiConditionallyApproveApplication(
  applicationId: string,
  input: Omit<ConditionalApprovalInput, "applicationId">
): Promise<ApiResponse<DecisionOperationResult>> {
  return fetch(`/api/cases/${applicationId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionType: "conditional_approval",
      ...input,
    }),
  }).then((r) => r.json());
}

/**
 * Make a rejection decision
 */
export async function apiRejectApplication(
  applicationId: string,
  input: Omit<RejectDecisionInput, "applicationId">
): Promise<ApiResponse<DecisionOperationResult>> {
  return fetch(`/api/cases/${applicationId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionType: "rejected",
      ...input,
    }),
  }).then((r) => r.json());
}

/**
 * Make a waitlist decision
 */
export async function apiWaitlistApplication(
  applicationId: string,
  input: Omit<WaitlistDecisionInput, "applicationId">
): Promise<ApiResponse<DecisionOperationResult>> {
  return fetch(`/api/cases/${applicationId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionType: "waitlisted",
      ...input,
    }),
  }).then((r) => r.json());
}

/**
 * Make an escalation decision
 */
export async function apiEscalateApplication(
  applicationId: string,
  input: Omit<EscalateDecisionInput, "applicationId">
): Promise<ApiResponse<DecisionOperationResult>> {
  return fetch(`/api/cases/${applicationId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionType: "escalated",
      ...input,
    }),
  }).then((r) => r.json());
}

/**
 * Request additional information
 */
export async function apiRequestAdditionalInfo(
  applicationId: string,
  input: Omit<RequestAdditionalInfoInput, "applicationId">
): Promise<ApiResponse<DecisionOperationResult>> {
  return fetch(`/api/cases/${applicationId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionType: "needs_info",
      ...input,
    }),
  }).then((r) => r.json());
}

/**
 * Withdraw application
 */
export async function apiWithdrawApplication(
  applicationId: string,
  input: Omit<WithdrawDecisionInput, "applicationId">
): Promise<ApiResponse<DecisionOperationResult>> {
  return fetch(`/api/cases/${applicationId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionType: "withdrawn",
      ...input,
    }),
  }).then((r) => r.json());
}

/**
 * Close case
 */
export async function apiCloseCase(
  applicationId: string,
  input: Omit<CloseDecisionInput, "applicationId">
): Promise<ApiResponse<DecisionOperationResult>> {
  return fetch(`/api/cases/${applicationId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionType: "closed",
      ...input,
    }),
  }).then((r) => r.json());
}

/**
 * Get decision history
 */
export async function apiGetDecisionHistory(
  applicationId: string,
  limit: number = 50
): Promise<ApiResponse<{ decisions: DecisionHistoryRecord[] }>> {
  const params = new URLSearchParams({ limit: limit.toString() });
  return fetch(`/api/cases/${applicationId}/decisions?${params}`).then((r) =>
    r.json()
  );
}

/**
 * Get latest decision
 */
export async function apiGetLatestDecision(
  applicationId: string
): Promise<ApiResponse<{ decision: DecisionHistoryRecord | null }>> {
  return fetch(`/api/cases/${applicationId}/decisions?latest=true`).then((r) =>
    r.json()
  );
}

/**
 * Check application readiness
 */
export async function apiCheckApplicationReadiness(
  applicationId: string
): Promise<ApiResponse<ApplicationReadinessCheck>> {
  return fetch(`/api/cases/${applicationId}/readiness`).then((r) => r.json());
}

/**
 * Handle API errors with user-friendly messages
 */
export function getErrorMessage(error: any): string {
  if (error?.error?.message) {
    return error.error.message;
  }
  if (error?.message) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

/**
 * Render a decision template with applicant data
 */
export function renderDecisionTemplate(
  template: string,
  applicantName: string,
  programName: string,
  additionalVars?: Record<string, any>
): string {
  const variables: Record<string, any> = {
    applicantName,
    programName,
    ...additionalVars,
  };

  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value == null ? `{{${key}}}` : String(value);
  });
}
