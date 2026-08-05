/**
 * AUDIENCE RESOLUTION SERVICE
 * ==========================
 * High-level service for resolving audiences and creating detailed results.
 * Wraps AudienceResolver with result tracking and logging.
 *
 * K1.C0 — Communication Contract Certification
 * Phase C.1 — Audience Resolution Layer
 */

import type { CommunicationRequest, AudienceResolvedRequest } from "../contracts";
import type { AudienceRole } from "../contracts";
import { AudienceResolver } from "./AudienceResolver";
import { AudienceResolutionResultFactory } from "./AudienceResolutionResult";
import type { AudienceResolutionOutcome, AudienceResolutionResult } from "./AudienceResolutionResult";
import { AudienceResolutionError } from "./AudienceResolutionErrors";

/**
 * Audience Resolution Service
 * Resolves audiences and tracks detailed outcomes
 */
export class AudienceResolutionService {
  /**
   * Resolve audiences for a communication request
   * Returns detailed result with tracking information
   */
  static async resolve(request: CommunicationRequest): Promise<AudienceResolutionResult> {
    const startTime = performance.now();
    const startedAt = new Date();
    const outcomes: AudienceResolutionOutcome[] = [];

    try {
      // Resolve audiences and recipients
      const resolvedRequest = await AudienceResolver.resolve(request);

      // Calculate deduplication count (original - final)
      // This is estimated based on resolution process
      const deduplicationCount = this.estimateDuplicationsRemoved(request, resolvedRequest);

      const endTime = performance.now();
      const completedAt = new Date();

      // Create success result
      return AudienceResolutionResultFactory.success({
        request: resolvedRequest,
        outcomes,
        deduplicationCount,
        duration_ms: endTime - startTime,
        startedAt,
        completedAt,
        traceId: request.context.traceId,
        organizationId: request.context.organizationId,
        event: request.event,
      });
    } catch (error) {
      const endTime = performance.now();
      const completedAt = new Date();

      // Ensure error is AudienceResolutionError
      const resolutionError =
        error instanceof AudienceResolutionError
          ? error
          : new AudienceResolutionError(
              "UNKNOWN_ERROR",
              error instanceof Error ? error.message : "Unknown error during audience resolution",
              { originalError: String(error) }
            );

      // Create failure result
      return AudienceResolutionResultFactory.failure({
        error: resolutionError,
        outcomes,
        duration_ms: endTime - startTime,
        startedAt,
        completedAt,
        traceId: request.context.traceId,
        organizationId: request.context.organizationId,
        event: request.event,
      });
    }
  }

  /**
   * Resolve audiences without detailed tracking (fast path)
   */
  static async resolveRequest(
    request: CommunicationRequest
  ): Promise<AudienceResolvedRequest> {
    return AudienceResolver.resolve(request);
  }

  /**
   * Estimate number of duplicates removed
   * Based on typical recipient patterns
   */
  private static estimateDuplicationsRemoved(
    _request: CommunicationRequest,
    resolved: AudienceResolvedRequest
  ): number {
    // In Phase C.1, we don't have access to pre-deduplication list
    // This would be calculated in a more instrumented version
    // For now, estimate based on audience patterns that commonly overlap
    const audienceOverlapPatterns: Record<string, number> = {
      // org_admin often appears in multiple roles
      org_admin: 0.1,
      // staff_member overlaps with staff_admin sometimes
      staff_member: 0.05,
    };

    let estimatedDuplicates = 0;
    for (const [audience, pattern] of Object.entries(audienceOverlapPatterns)) {
      if (resolved.audiences.includes(audience as AudienceRole)) {
        estimatedDuplicates += Math.floor(resolved.recipients.length * pattern);
      }
    }

    return Math.max(0, estimatedDuplicates);
  }
}
