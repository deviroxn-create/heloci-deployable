/**
 * COMMUNICATION REQUEST SERIALIZER
 * ================================
 * Serializes/deserializes CommunicationRequest for storage and transmission.
 * Handles all 4 progressive enrichment stages.
 *
 * K1.C0 — Communication Contract Certification
 */

import type {
  AnyCommunicationRequest,
  CommunicationRequest as ICommunicationRequest,
  AudienceResolvedRequest,
  PlannedCommunication,
  RenderedCommunication,
  Recipient,
  ChannelPlan,
  Template,
  RenderedTemplate,
  CommunicationChannel,
  AudienceRole,
} from "./CommunicationTypes";
import { CommunicationRequestValidator } from "./CommunicationRequest";

/**
 * Serialized format supports all 4 stages
 */
export interface SerializedCommunicationRequest {
  // Runtime context
  context: {
    traceId: string;
    organizationId: string;
    userId?: string;
    createdAt: string; // ISO 8601
    createdBy?: string;
    priority?: "critical" | "high" | "normal" | "low";
    tags?: string[];
    correlationId?: string;
  };

  // Event context (always present)
  event: string; // CommunicationEvent
  eventPayload: Record<string, unknown>;

  // Stage marker
  __stage: "initial" | "audience_resolved" | "planned" | "rendered";

  // Stage 2+ fields
  audiences?: string[]; // AudienceRole[]
  recipients?: any[];

  // Stage 3+ fields
  channels?: string[]; // CommunicationChannel[]
  channelPlan?: any[];

  // Stage 4 fields
  template?: any;
  rendered?: any;

  version: string; // Contract version for migration
}

/**
 * CommunicationRequest Serializer - Stage-Aware
 */
export class CommunicationRequestSerializer {
  private static CONTRACT_VERSION = "2.0.0";

  /**
   * Serialize a CommunicationRequest (any stage) to JSON-compatible format
   */
  static serialize(request: AnyCommunicationRequest): SerializedCommunicationRequest {
    // Validate request before serializing
    const validation = CommunicationRequestValidator.validate(request);
    if (!validation.valid) {
      throw new Error(`Cannot serialize invalid request: ${validation.errors.join("; ")}`);
    }

    // Build base serialization
    const serialized: SerializedCommunicationRequest = {
      context: {
        traceId: request.context.traceId,
        organizationId: request.context.organizationId,
        userId: request.context.userId,
        createdAt: request.context.createdAt.toISOString(),
        createdBy: request.context.createdBy,
        priority: request.context.priority,
        tags: request.context.tags ? Array.from(request.context.tags) : undefined,
        correlationId: request.context.correlationId,
      },
      event: request.event,
      eventPayload: request.eventPayload as Record<string, unknown>,
      __stage: request.__stage,
      version: this.CONTRACT_VERSION,
    };

    // Add stage-specific fields
    if (request.__stage === "initial") {
      // Stage 1 - only context and event
      return serialized;
    }

    // Stage 2+
    if ("audiences" in request && request.audiences) {
      serialized.audiences = Array.from(request.audiences);
    }
    if ("recipients" in request && request.recipients) {
      serialized.recipients = Array.from(request.recipients).map((r) => this.serializeRecipient(r));
    }

    if (request.__stage === "audience_resolved") {
      return serialized;
    }

    // Stage 3+
    if ("channels" in request && request.channels) {
      serialized.channels = Array.from(request.channels);
    }
    if ("channelPlan" in request && request.channelPlan) {
      serialized.channelPlan = Array.from(request.channelPlan).map((p) => this.serializeChannelPlan(p));
    }

    if (request.__stage === "planned") {
      return serialized;
    }

    // Stage 4
    if ("template" in request && request.template) {
      serialized.template = this.serializeTemplate(request.template);
    }
    if ("rendered" in request && request.rendered) {
      serialized.rendered = this.serializeRendered(request.rendered);
    }

    return serialized;
  }

  /**
   * Deserialize JSON back to appropriate stage
   */
  static deserialize(data: any): AnyCommunicationRequest {
    // Check version compatibility
    const version = data.version || "1.0.0";
    if (!this.isCompatibleVersion(version)) {
      throw new Error(`Incompatible contract version: ${version} (current: ${this.CONTRACT_VERSION})`);
    }

    // Validate stage marker
    const stage = data.__stage;
    if (!["initial", "audience_resolved", "planned", "rendered"].includes(stage)) {
      throw new Error(`Invalid stage marker: ${stage}`);
    }

    // Reconstruct context
    const context = {
      traceId: data.context.traceId,
      organizationId: data.context.organizationId,
      userId: data.context.userId,
      createdAt: new Date(data.context.createdAt),
      createdBy: data.context.createdBy,
      priority: data.context.priority as "critical" | "high" | "normal" | "low" | undefined,
      tags: data.context.tags ? Object.freeze(data.context.tags) : undefined,
      correlationId: data.context.correlationId,
    };

    // Base request (all stages have this)
    const base = {
      context: Object.freeze(context),
      event: data.event,
      eventPayload: Object.freeze(data.eventPayload || {}),
      __stage: stage as any,
    };

    // Stage 1
    if (stage === "initial") {
      return Object.freeze(base as ICommunicationRequest);
    }

    // Stage 2+
    const stage2: any = {
      ...base,
      audiences: Object.freeze(data.audiences || []),
      recipients: Object.freeze((data.recipients || []).map((r: any) => this.deserializeRecipient(r))),
    };

    if (stage === "audience_resolved") {
      return Object.freeze(stage2 as AudienceResolvedRequest);
    }

    // Stage 3+
    const stage3: any = {
      ...stage2,
      channels: Object.freeze(data.channels || []),
      channelPlan: Object.freeze((data.channelPlan || []).map((p: any) => this.deserializeChannelPlan(p))),
    };

    if (stage === "planned") {
      return Object.freeze(stage3 as PlannedCommunication);
    }

    // Stage 4
    const stage4: any = {
      ...stage3,
      template: data.template ? this.deserializeTemplate(data.template) : undefined,
      rendered: data.rendered ? this.deserializeRendered(data.rendered) : undefined,
    };

    // Validate deserialized request
    const validation = CommunicationRequestValidator.validate(stage4);
    if (!validation.valid) {
      throw new Error(`Deserialized request is invalid: ${validation.errors.join("; ")}`);
    }

    return Object.freeze(stage4 as RenderedCommunication);
  }

  /**
   * Convert to JSON string
   */
  static toJSON(request: AnyCommunicationRequest): string {
    const serialized = this.serialize(request);
    return JSON.stringify(serialized);
  }

  /**
   * Parse from JSON string
   */
  static fromJSON(json: string): AnyCommunicationRequest {
    const data = JSON.parse(json);
    return this.deserialize(data);
  }

  /**
   * Extract fields for logging (minimal footprint)
   */
  static extractForLogging(request: AnyCommunicationRequest): {
    traceId: string;
    event: string;
    organizationId: string;
    stage: string;
    recipientCount: number;
    channels: string[];
    createdAt: string;
  } {
    const recipientCount = "recipients" in request ? request.recipients.length : 0;
    const channels = "channels" in request ? Array.from(request.channels) : [];

    return {
      traceId: request.context.traceId,
      event: request.event,
      organizationId: request.context.organizationId,
      stage: request.__stage,
      recipientCount,
      channels,
      createdAt: request.context.createdAt.toISOString(),
    };
  }

  /**
   * Compare two serialized requests for changes
   */
  static diff(
    original: SerializedCommunicationRequest,
    updated: SerializedCommunicationRequest
  ): {
    hasChanges: boolean;
    changedStage: boolean;
    changes: Record<string, { before: unknown; after: unknown }>;
  } {
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    // Check immutable fields (should never change)
    const immutableFields = ["traceId", "event"];
    for (const field of immutableFields) {
      const origVal = field === "traceId" ? original.context.traceId : (original as any)[field];
      const updVal = field === "traceId" ? updated.context.traceId : (updated as any)[field];
      if (origVal !== updVal) {
        changes[field] = { before: origVal, after: updVal };
      }
    }

    // Check if stage changed (allowed progression only)
    const stageOrder = ["initial", "audience_resolved", "planned", "rendered"];
    const changedStage = original.__stage !== updated.__stage;
    if (changedStage) {
      const origIndex = stageOrder.indexOf(original.__stage);
      const updIndex = stageOrder.indexOf(updated.__stage);
      if (updIndex <= origIndex) {
        changes["__stage"] = {
          before: original.__stage,
          after: updated.__stage,
        };
      }
    }

    // Check enrichable fields
    const enrichableFields = ["audiences", "recipients", "channels", "channelPlan", "template", "rendered"];
    for (const field of enrichableFields) {
      const orig = (original as any)[field];
      const upd = (updated as any)[field];
      if (JSON.stringify(orig) !== JSON.stringify(upd)) {
        changes[field] = { before: orig, after: upd };
      }
    }

    return {
      hasChanges: Object.keys(changes).length > 0,
      changedStage,
      changes,
    };
  }

  // Private serialization helpers

  private static serializeRecipient(recipient: Recipient): any {
    return {
      id: recipient.id,
      email: recipient.email,
      name: recipient.name,
      role: recipient.role,
      organizationId: recipient.organizationId,
      preferences: recipient.preferences,
      metadata: recipient.metadata,
    };
  }

  private static deserializeRecipient(data: any): Recipient {
    return Object.freeze({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as AudienceRole,
      organizationId: data.organizationId,
      preferences: data.preferences ? Object.freeze(data.preferences) : undefined,
      metadata: data.metadata ? Object.freeze(data.metadata) : undefined,
    });
  }

  private static serializeChannelPlan(plan: ChannelPlan): any {
    return {
      recipientId: plan.recipientId,
      primary: plan.primary,
      fallbacks: Array.from(plan.fallbacks || []),
      disabled: plan.disabled ? Array.from(plan.disabled) : undefined,
      priority: plan.priority,
    };
  }

  private static deserializeChannelPlan(data: any): ChannelPlan {
    const plan = {
      recipientId: data.recipientId,
      primary: data.primary as CommunicationChannel,
      fallbacks: Object.freeze((data.fallbacks || []) as readonly CommunicationChannel[]),
      disabled: data.disabled ? Object.freeze(data.disabled as readonly CommunicationChannel[]) : undefined,
      priority: data.priority as "critical" | "high" | "normal" | "low" | undefined,
    };
    return Object.freeze(plan) as ChannelPlan;
  }

  private static serializeTemplate(template: Template): any {
    return {
      id: template.id,
      name: template.name,
      version: template.version,
      language: template.language,
      channel: template.channel,
      variables: Array.from(template.variables || []),
      status: template.status,
    };
  }

  private static deserializeTemplate(data: any): Template {
    return Object.freeze({
      id: data.id,
      name: data.name,
      version: data.version,
      language: data.language,
      channel: data.channel as CommunicationChannel,
      variables: Object.freeze(data.variables || []) as readonly string[],
      status: data.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    });
  }

  private static serializeRendered(rendered: RenderedTemplate): any {
    return {
      templateId: rendered.templateId,
      subject: rendered.subject,
      body: rendered.body,
      html: rendered.html,
      plainText: rendered.plainText,
      variables: {
        substituted: rendered.variables?.substituted || {},
        missing: Array.from(rendered.variables?.missing || []),
      },
    };
  }

  private static deserializeRendered(data: any): RenderedTemplate {
    return Object.freeze({
      templateId: data.templateId,
      subject: data.subject,
      body: data.body,
      html: data.html,
      plainText: data.plainText,
      variables: Object.freeze({
        substituted: data.variables?.substituted || {},
        missing: Object.freeze(data.variables?.missing || []),
      }),
    });
  }

  private static isCompatibleVersion(version: string): boolean {
    // Support version 2.0.0 (new progressive model)
    // Could support 1.0.0 with migration logic if needed
    return version === this.CONTRACT_VERSION || version === "2.0.0";
  }
}
