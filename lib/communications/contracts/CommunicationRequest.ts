/**
 * COMMUNICATION REQUEST - LEGACY COMPATIBILITY LAYER
 * ==================================================
 * DEPRECATED: This file contains legacy interfaces and builders that are no longer
 * part of the production architecture.
 *
 * K1.C0 Hardening transitioned from a monolithic builder to progressive enrichment.
 * This file is maintained only for reference and to avoid breaking imports.
 *
 * WHAT CHANGED:
 * - Single flat CommunicationRequest → 4 progressive stage-specific interfaces
 * - Monolithic builder → 4 stage-specific builders
 * - String event names → Type-safe CommunicationEvent enum
 * - Shallow frozen payload → Deep frozen eventPayload
 *
 * NEW ARCHITECTURE:
 * - Use ProgressiveEnrichmentFactory for building all communication requests
 * - Use InitialRequestBuilder to create stage 1 (initial request)
 * - Use AudienceResolvedBuilder to create stage 2 (with audiences/recipients)
 * - Use CommunicationPlannerBuilder to create stage 3 (with channels)
 * - Use TemplateResolutionBuilder to create stage 4 (ready to send)
 *
 * MIGRATION GUIDE:
 * See .kiro/K1-C0-MIGRATION-REPORT.md for detailed migration instructions
 * See .kiro/K1-C0-IMPLEMENTATION-GUIDE.md for new builder usage examples
 *
 * K1.C0 — Communication Contract Certification
 */

import type {
  AnyCommunicationRequest,
  CommunicationRequest as ICommunicationRequest,
  AudienceRole,
  CommunicationChannel,
  Recipient,
  ChannelPlan,
  Template,
  RenderedTemplate,
  ValidationResult,
  BuilderResult,
} from "./CommunicationTypes";
import { RecipientValidator } from "./Recipient";
import { ChannelPlanValidator } from "./ChannelPlan";
import { RenderedTemplateValidator } from "./RenderedTemplate";

/**
 * @deprecated Use ProgressiveEnrichmentFactory and stage-specific builders instead
 */
export class CommunicationRequestBuilder {
  private traceId?: string;
  private organizationId?: string;
  private userId?: string;
  private event?: string;
  private eventPayload?: Record<string, unknown>;
  private audiences: AudienceRole[] = [];
  private recipients: Recipient[] = [];
  private channels: CommunicationChannel[] = [];
  private channelPlan: ChannelPlan[] = [];
  private template?: Template;
  private rendered?: RenderedTemplate;
  private tags: string[] = [];
  private correlationId?: string;

  withTraceId(traceId: string): this {
    this.traceId = traceId;
    return this;
  }

  withOrganizationId(organizationId: string): this {
    this.organizationId = organizationId;
    return this;
  }

  withUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  withEvent(event: string): this {
    this.event = event;
    return this;
  }

  withEventPayload(payload: Record<string, unknown>): this {
    this.eventPayload = payload;
    return this;
  }

  withAudiences(audiences: AudienceRole[]): this {
    this.audiences = audiences;
    return this;
  }

  withRecipients(recipients: Recipient[]): this {
    this.recipients = recipients;
    return this;
  }

  withChannels(channels: CommunicationChannel[]): this {
    this.channels = channels;
    return this;
  }

  withChannelPlan(plan: ChannelPlan[]): this {
    this.channelPlan = plan;
    return this;
  }

  withTemplate(template: Template): this {
    this.template = template;
    return this;
  }

  withRendered(rendered: RenderedTemplate): this {
    this.rendered = rendered;
    return this;
  }

  withTags(tags: string[]): this {
    this.tags = tags;
    return this;
  }

  withCorrelationId(correlationId: string): this {
    this.correlationId = correlationId;
    return this;
  }

  /**
   * Build - Returns error for deprecated builder
   * @deprecated Use ProgressiveEnrichmentFactory instead
   */
  build(): BuilderResult {
    return {
      success: false,
      errors: [
        "CommunicationRequestBuilder is deprecated and no longer functional.",
        "Use ProgressiveEnrichmentFactory and stage-specific builders instead.",
        "See .kiro/K1-C0-MIGRATION-REPORT.md for migration guidance.",
      ],
    };
  }

  private validate(): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!this.traceId) errors.push("traceId is required");
    if (!this.organizationId) errors.push("organizationId is required");
    if (!this.event) errors.push("event is required");
    if (this.eventPayload === undefined) errors.push("eventPayload is required");
    if (this.audiences.length === 0) errors.push("at least one audience is required");
    if (this.recipients.length === 0) errors.push("at least one recipient is required");
    if (this.channels.length === 0) errors.push("at least one channel is required");
    if (this.channelPlan.length === 0) errors.push("channelPlan cannot be empty");
    if (!this.template) errors.push("template is required");
    if (!this.rendered) errors.push("rendered is required");

    // Recipient validation
    if (this.recipients.length > 0) {
      const recipientValidation = RecipientValidator.validateBatch(this.recipients);
      if (!recipientValidation.valid) {
        errors.push(`Recipients validation failed: ${recipientValidation.errors.join("; ")}`);
      }
    }

    // Channel plan validation
    if (this.channelPlan.length > 0) {
      const planValidation = ChannelPlanValidator.validateBatch(this.channelPlan);
      if (!planValidation.valid) {
        errors.push(`Channel plan validation failed: ${planValidation.errors.join("; ")}`);
      }

      // Check coverage
      const recipientIds = new Set(this.recipients.map((r) => r.id));
      const coverageValidation = ChannelPlanValidator.validateRecipientCoverage(this.channelPlan, recipientIds);
      if (!coverageValidation.valid) {
        errors.push(`Channel plan coverage failed: ${coverageValidation.errors.join("; ")}`);
      }
    }

    // Rendered template validation
    if (this.rendered) {
      const templateValidation = RenderedTemplateValidator.validate(this.rendered, this.channels[0]);
      if (!templateValidation.valid) {
        errors.push(`Rendered template validation failed: ${templateValidation.errors.join("; ")}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}

/**
 * @deprecated Use ProgressiveEnrichmentFactory instead
 *
 * Validates complete CommunicationRequest
 * Note: This validator only works with legacy flat structure requests.
 * For new stage-specific interfaces, validation is built into builders.
 */
export class CommunicationRequestValidator {
  /**
   * Validate complete CommunicationRequest
   * @deprecated Use stage-specific builders instead (they validate internally)
   */
  static validate(request: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request) {
      return {
        valid: false,
        errors: ["CommunicationRequest is required"],
        warnings: [],
      };
    }

    // Check for new stage-based structure
    if (request.__stage) {
      warnings.push("Request uses new progressive stage model - use stage-specific validators instead");
      
      // Route to appropriate stage validator based on __stage
      if (request.__stage === "initial") {
        // Initial request validation
        if (!request.context?.traceId) errors.push("context.traceId is required");
        if (!request.context?.organizationId) errors.push("context.organizationId is required");
        if (!request.event) errors.push("event is required");
        if (request.eventPayload === undefined) errors.push("eventPayload is required");
      } else if (request.__stage === "audience_resolved") {
        // Stage 2 validation
        if (!request.audiences || request.audiences.length === 0) errors.push("audiences are required");
        if (!request.recipients || request.recipients.length === 0) errors.push("recipients are required");
      } else if (request.__stage === "planned") {
        // Stage 3 validation
        if (!request.channels || request.channels.length === 0) errors.push("channels are required");
        if (!request.channelPlan || request.channelPlan.length === 0) errors.push("channelPlan is required");
      } else if (request.__stage === "rendered") {
        // Stage 4 validation
        if (!request.template) errors.push("template is required");
        if (!request.rendered) errors.push("rendered is required");
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    }

    // Legacy flat structure validation (if applicable)
    if (!request.traceId) errors.push("traceId is required");
    if (request.traceId && typeof request.traceId !== "string") errors.push("traceId must be string");

    if (!request.organizationId) errors.push("organizationId is required");
    if (request.organizationId && typeof request.organizationId !== "string") errors.push("organizationId must be string");

    if (request.userId && typeof request.userId !== "string") errors.push("userId must be string");

    if (!request.event) errors.push("event is required");
    if (request.event && typeof request.event !== "string") errors.push("event must be string");

    if (request.eventPayload === undefined) errors.push("eventPayload is required");
    if (request.eventPayload !== null && typeof request.eventPayload !== "object") {
      errors.push("eventPayload must be object");
    }

    if (!request.recipients || request.recipients.length === 0) {
      errors.push("at least one recipient is required");
    }
    if (request.recipients && !Array.isArray(request.recipients)) {
      errors.push("recipients must be array");
    }

    if (request.recipients && request.recipients.length > 0) {
      const recipientValidation = RecipientValidator.validateBatch(request.recipients);
      if (!recipientValidation.valid) {
        errors.push(`Recipient validation failed: ${recipientValidation.errors.join("; ")}`);
      }
    }

    if (request.channelPlan && request.channelPlan.length > 0) {
      const planValidation = ChannelPlanValidator.validateBatch(request.channelPlan);
      if (!planValidation.valid) {
        errors.push(`Channel plan validation failed: ${planValidation.errors.join("; ")}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate that request matches expected structure for logging
   * @deprecated Use appropriate stage-specific validation
   */
  static validateForLogging(request: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.traceId && !request.context?.traceId) errors.push("traceId required for logging");
    if (!request.event) errors.push("event required for logging");
    if (!request.organizationId && !request.context?.organizationId) errors.push("organizationId required for logging");

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * @deprecated Use ProgressiveEnrichmentFactory instead
 */
export class CommunicationRequestFactory {
  /**
   * Create a CommunicationRequest from a builder
   * @deprecated Use ProgressiveEnrichmentFactory instead
   */
  static createFromBuilder(
    builderFn: (builder: CommunicationRequestBuilder) => void
  ): { success: boolean; request?: any; errors: string[] } {
    const builder = new CommunicationRequestBuilder();
    builderFn(builder);
    const result = builder.build();

    return {
      success: false,
      errors: [
        "CommunicationRequestFactory.createFromBuilder is deprecated.",
        "Use ProgressiveEnrichmentFactory.createInitialRequest() instead.",
        "See .kiro/K1-C0-MIGRATION-REPORT.md for migration guidance.",
      ],
    };
  }

  /**
   * Enrich an existing CommunicationRequest immutably
   * @deprecated Use stage-specific builders instead
   */
  static enrich(
    request: AnyCommunicationRequest,
    updates: Partial<Record<string, unknown>>
  ): { success: boolean; request?: AnyCommunicationRequest; errors: string[] } {
    return {
      success: false,
      errors: [
        "CommunicationRequestFactory.enrich is deprecated.",
        "Use stage-specific builders (AudienceResolvedBuilder, CommunicationPlannerBuilder, TemplateResolutionBuilder) instead.",
        "See .kiro/K1-C0-MIGRATION-REPORT.md for migration guidance.",
      ],
    };
  }
}
