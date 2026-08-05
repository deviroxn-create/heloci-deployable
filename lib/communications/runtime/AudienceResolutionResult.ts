/**
 * AUDIENCE RESOLUTION RESULT
 * =========================
 * Immutable result wrapper for audience resolution operations.
 * Used for tracking resolution outcomes and debugging.
 *
 * K1.C0 — Communication Contract Certification
 * Phase C.1 — Audience Resolution Layer
 */

import type { AudienceResolvedRequest, Recipient, AudienceRole } from "../contracts";
import { AudienceResolutionError } from "./AudienceResolutionErrors";

/**
 * Result of resolving an audience for a single role
 */
export interface AudienceResolutionOutcome {
  readonly role: AudienceRole;
  readonly recipientCount: number;
  readonly recipients: readonly Recipient[];
  readonly success: boolean;
  readonly error?: AudienceResolutionError;
  readonly duration_ms: number;
}

/**
 * Complete result of audience resolution
 */
export interface AudienceResolutionResult {
  readonly success: boolean;
  readonly request?: AudienceResolvedRequest;
  readonly error?: AudienceResolutionError;

  // Detailed breakdown by audience
  readonly outcomes: readonly AudienceResolutionOutcome[];

  // Summary statistics
  readonly totalRecipients: number;
  readonly audiencesResolved: number;
  readonly audiencesFailed: number;
  readonly deduplicationCount: number;

  // Timing
  readonly duration_ms: number;
  readonly startedAt: Date;
  readonly completedAt: Date;

  // Audit trail
  readonly traceId: string;
  readonly organizationId: string;
  readonly event: string;
}

/**
 * Factory for creating immutable resolution results
 */
export class AudienceResolutionResultFactory {
  /**
   * Create a success result
   */
  static success(params: {
    request: AudienceResolvedRequest;
    outcomes: AudienceResolutionOutcome[];
    deduplicationCount: number;
    duration_ms: number;
    startedAt: Date;
    completedAt: Date;
    traceId: string;
    organizationId: string;
    event: string;
  }): AudienceResolutionResult {
    const successOutcomes = params.outcomes.filter((o) => o.success);
    const failedOutcomes = params.outcomes.filter((o) => !o.success);

    const result: AudienceResolutionResult = Object.freeze({
      success: true,
      request: params.request,
      outcomes: Object.freeze([...params.outcomes]),
      totalRecipients: params.request.recipients.length,
      audiencesResolved: successOutcomes.length,
      audiencesFailed: failedOutcomes.length,
      deduplicationCount: params.deduplicationCount,
      duration_ms: params.duration_ms,
      startedAt: params.startedAt,
      completedAt: params.completedAt,
      traceId: params.traceId,
      organizationId: params.organizationId,
      event: params.event,
    });

    return result;
  }

  /**
   * Create a failure result
   */
  static failure(params: {
    error: AudienceResolutionError;
    outcomes: AudienceResolutionOutcome[];
    duration_ms: number;
    startedAt: Date;
    completedAt: Date;
    traceId: string;
    organizationId: string;
    event: string;
  }): AudienceResolutionResult {
    const successOutcomes = params.outcomes.filter((o) => o.success);
    const failedOutcomes = params.outcomes.filter((o) => !o.success);

    const result: AudienceResolutionResult = Object.freeze({
      success: false,
      error: params.error,
      outcomes: Object.freeze([...params.outcomes]),
      totalRecipients: 0,
      audiencesResolved: successOutcomes.length,
      audiencesFailed: failedOutcomes.length,
      deduplicationCount: 0,
      duration_ms: params.duration_ms,
      startedAt: params.startedAt,
      completedAt: params.completedAt,
      traceId: params.traceId,
      organizationId: params.organizationId,
      event: params.event,
    });

    return result;
  }

  /**
   * Convert result to JSON-serializable object
   */
  static toJSON(result: AudienceResolutionResult): Record<string, unknown> {
    return {
      success: result.success,
      totalRecipients: result.totalRecipients,
      audiencesResolved: result.audiencesResolved,
      audiencesFailed: result.audiencesFailed,
      deduplicationCount: result.deduplicationCount,
      duration_ms: result.duration_ms,
      startedAt: result.startedAt.toISOString(),
      completedAt: result.completedAt.toISOString(),
      traceId: result.traceId,
      organizationId: result.organizationId,
      event: result.event,
      error: result.error
        ? {
            code: result.error.code,
            message: result.error.message,
            context: result.error.context,
          }
        : undefined,
      outcomes: result.outcomes.map((o) => ({
        role: o.role,
        recipientCount: o.recipientCount,
        success: o.success,
        duration_ms: o.duration_ms,
        error: o.error
          ? {
              code: o.error.code,
              message: o.error.message,
            }
          : undefined,
      })),
    };
  }
}
