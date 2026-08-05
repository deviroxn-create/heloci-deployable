/**
 * PROGRESSIVE ENRICHMENT BUILDERS
 * ==============================
 * Builders for each stage of communication processing
 * Ensures immutability at each layer with type-safe progression
 *
 * K1.C0 Hardening - Progressive Enrichment Model
 */

import type {
  CommunicationRequest,
  AudienceResolvedRequest,
  PlannedCommunication,
  RenderedCommunication,
  CommunicationEvent,
  CommunicationRuntimeContext,
  AudienceRole,
  CommunicationChannel,
  Recipient,
  ChannelPlan,
  Template,
  RenderedTemplate,
  DeepReadonly,
} from "./CommunicationTypes";
import { VALID_COMMUNICATION_EVENTS, VALID_CHANNELS, VALID_AUDIENCE_ROLES } from "./CommunicationTypes";

/**
 * STAGE 1: INITIAL REQUEST BUILDER
 * Creates initial CommunicationRequest at domain event publication
 */
export class InitialRequestBuilder {
  private traceId?: string;
  private organizationId?: string;
  private userId?: string;
  private event?: CommunicationEvent;
  private eventPayload?: Record<string, unknown>;
  private priority?: "critical" | "high" | "normal" | "low";
  private tags: string[] = [];
  private correlationId?: string;
  private createdAt: Date = new Date();
  private createdBy?: string;

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

  /**
   * Set event using type-safe CommunicationEvent enum
   */
  withEvent(event: CommunicationEvent): this {
    this.event = event;
    return this;
  }

  /**
   * Set event payload (will be deep-frozen)
   */
  withEventPayload(payload: Record<string, unknown>): this {
    this.eventPayload = payload;
    return this;
  }

  withPriority(priority: "critical" | "high" | "normal" | "low"): this {
    this.priority = priority;
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

  withCreatedBy(createdBy: string): this {
    this.createdBy = createdBy;
    return this;
  }

  /**
   * Build initial request - validates all required fields
   */
  build(): { success: boolean; request?: CommunicationRequest; errors: string[] } {
    const errors: string[] = [];

    if (!this.traceId) errors.push("traceId is required");
    if (!this.organizationId) errors.push("organizationId is required");
    if (!this.event) errors.push("event is required");
    if (this.eventPayload === undefined) errors.push("eventPayload is required");

    if (this.event && !VALID_COMMUNICATION_EVENTS.includes(this.event)) {
      errors.push(`Invalid event: ${this.event}`);
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Deep freeze eventPayload
    const frozenPayload = this.deepFreeze(this.eventPayload!) as DeepReadonly<Record<string, unknown>>;

    const request: CommunicationRequest = Object.freeze({
      context: Object.freeze({
        traceId: this.traceId!,
        organizationId: this.organizationId!,
        userId: this.userId,
        createdAt: this.createdAt,
        createdBy: this.createdBy,
        priority: this.priority,
        tags: this.tags.length > 0 ? Object.freeze(this.tags) : undefined,
        correlationId: this.correlationId,
      }),
      event: this.event!,
      eventPayload: frozenPayload,
      __stage: "initial",
    });

    return { success: true, request, errors: [] };
  }

  private deepFreeze(obj: any): any {
    if (obj === null || typeof obj !== "object") return obj;
    if (Object.isFrozen(obj)) return obj;

    const frozen = Object.freeze(obj);
    Object.getOwnPropertyNames(frozen).forEach((prop) => {
      if (frozen[prop] !== null && (typeof frozen[prop] === "object" || typeof frozen[prop] === "function")) {
        this.deepFreeze(frozen[prop]);
      }
    });

    return frozen;
  }
}

/**
 * STAGE 2: AUDIENCE RESOLUTION BUILDER
 * Enriches initial request with resolved audiences and recipients
 */
export class AudienceResolvedBuilder {
  constructor(private initialRequest: CommunicationRequest) {}

  build(
    audiences: AudienceRole[],
    recipients: Recipient[]
  ): { success: boolean; request?: AudienceResolvedRequest; errors: string[] } {
    const errors: string[] = [];

    if (!audiences || audiences.length === 0) {
      errors.push("At least one audience is required");
    }

    if (!recipients || recipients.length === 0) {
      errors.push("At least one recipient is required");
    }

    // Validate audiences
    audiences.forEach((aud) => {
      if (!VALID_AUDIENCE_ROLES.includes(aud)) {
        errors.push(`Invalid audience: ${aud}`);
      }
    });

    // Validate recipients
    recipients.forEach((r) => {
      if (!r.id) errors.push("Recipient must have id");
      if (!r.email) errors.push("Recipient must have email");
      if (!r.role) errors.push("Recipient must have role");
      if (!r.organizationId) errors.push("Recipient must have organizationId");
      if (!VALID_AUDIENCE_ROLES.includes(r.role)) {
        errors.push(`Invalid recipient role: ${r.role}`);
      }
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const request: AudienceResolvedRequest = Object.freeze({
      ...this.initialRequest,
      audiences: Object.freeze(audiences),
      recipients: Object.freeze(recipients.map((r) => Object.freeze(r))),
      __stage: "audience_resolved",
    });

    return { success: true, request, errors: [] };
  }
}

/**
 * STAGE 3: COMMUNICATION PLANNING BUILDER
 * Enriches audience-resolved request with channels and channel plans
 */
export class CommunicationPlannerBuilder {
  constructor(private resolvedRequest: AudienceResolvedRequest) {}

  build(
    channels: CommunicationChannel[],
    channelPlan: ChannelPlan[]
  ): { success: boolean; request?: PlannedCommunication; errors: string[] } {
    const errors: string[] = [];

    if (!channels || channels.length === 0) {
      errors.push("At least one channel is required");
    }

    if (!channelPlan || channelPlan.length === 0) {
      errors.push("Channel plan cannot be empty");
    }

    // Validate channels
    channels.forEach((ch) => {
      if (!VALID_CHANNELS.includes(ch)) {
        errors.push(`Invalid channel: ${ch}`);
      }
    });

    // Validate channel plan
    const recipientIds = new Set(this.resolvedRequest.recipients.map((r) => r.id));
    channelPlan.forEach((plan) => {
      if (!plan.recipientId) errors.push("ChannelPlan must have recipientId");
      if (!plan.primary) errors.push("ChannelPlan must have primary channel");
      if (!VALID_CHANNELS.includes(plan.primary)) {
        errors.push(`Invalid primary channel: ${plan.primary}`);
      }
      if (plan.fallbacks && plan.fallbacks.includes(plan.primary)) {
        errors.push("Fallback channels cannot include primary channel");
      }
      if (!recipientIds.has(plan.recipientId)) {
        errors.push(`Channel plan references non-existent recipient: ${plan.recipientId}`);
      }
    });

    // Ensure all recipients have a channel plan
    const planRecipientIds = new Set(channelPlan.map((p) => p.recipientId));
    recipientIds.forEach((id) => {
      if (!planRecipientIds.has(id)) {
        errors.push(`No channel plan for recipient: ${id}`);
      }
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const request: PlannedCommunication = Object.freeze({
      ...this.resolvedRequest,
      channels: Object.freeze(channels),
      channelPlan: Object.freeze(channelPlan.map((p) => Object.freeze(p))),
      __stage: "planned",
    });

    return { success: true, request, errors: [] };
  }
}

/**
 * STAGE 4: TEMPLATE RESOLUTION BUILDER
 * Enriches planned communication with template and rendered content
 */
export class TemplateResolutionBuilder {
  constructor(private plannedRequest: PlannedCommunication) {}

  build(
    template: Template,
    rendered: RenderedTemplate
  ): { success: boolean; request?: RenderedCommunication; errors: string[] } {
    const errors: string[] = [];

    if (!template) {
      errors.push("Template is required");
    } else {
      if (!template.id) errors.push("Template must have id");
      if (!template.name) errors.push("Template must have name");
      if (!template.version) errors.push("Template must have version");
    }

    if (!rendered) {
      errors.push("Rendered content is required");
    } else {
      if (!rendered.templateId) errors.push("Rendered must have templateId");
      if (!rendered.body) errors.push("Rendered must have body");
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const request: RenderedCommunication = Object.freeze({
      ...this.plannedRequest,
      template: Object.freeze(template),
      rendered: Object.freeze(rendered),
      __stage: "rendered",
    });

    return { success: true, request, errors: [] };
  }
}

/**
 * PROGRESSIVE ENRICHMENT FACTORY
 * Provides convenient methods for building through all stages
 */
export class ProgressiveEnrichmentFactory {
  /**
   * Create initial request
   */
  static createInitialRequest(setup: (builder: InitialRequestBuilder) => void): CommunicationRequest {
    const builder = new InitialRequestBuilder();
    setup(builder);
    const result = builder.build();

    if (!result.success) {
      throw new Error(`Failed to build initial request: ${result.errors.join("; ")}`);
    }

    return result.request!;
  }

  /**
   * Enrich with audiences and recipients
   */
  static enrichWithAudiences(
    request: CommunicationRequest,
    audiences: AudienceRole[],
    recipients: Recipient[]
  ): AudienceResolvedRequest {
    const builder = new AudienceResolvedBuilder(request);
    const result = builder.build(audiences, recipients);

    if (!result.success) {
      throw new Error(`Failed to resolve audiences: ${result.errors.join("; ")}`);
    }

    return result.request!;
  }

  /**
   * Enrich with channels
   */
  static enrichWithChannels(
    request: AudienceResolvedRequest,
    channels: CommunicationChannel[],
    channelPlan: ChannelPlan[]
  ): PlannedCommunication {
    const builder = new CommunicationPlannerBuilder(request);
    const result = builder.build(channels, channelPlan);

    if (!result.success) {
      throw new Error(`Failed to plan communication: ${result.errors.join("; ")}`);
    }

    return result.request!;
  }

  /**
   * Enrich with template and rendering
   */
  static enrichWithTemplate(
    request: PlannedCommunication,
    template: Template,
    rendered: RenderedTemplate
  ): RenderedCommunication {
    const builder = new TemplateResolutionBuilder(request);
    const result = builder.build(template, rendered);

    if (!result.success) {
      throw new Error(`Failed to resolve template: ${result.errors.join("; ")}`);
    }

    return result.request!;
  }
}
