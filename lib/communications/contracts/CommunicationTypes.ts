/**
 * COMMUNICATION CONTRACT TYPES - HARDENED ARCHITECTURE
 * ====================================================
 * Core immutable types used throughout the communication runtime.
 * These types are frozen and cannot be modified by individual features.
 *
 * K1.C0 Hardening Pass - Progressive Enrichment Model
 * Immutability at each layer: Creation → Resolution → Planning → Rendering → Dispatch
 */

/**
 * COMMUNICATION EVENT ENUM
 * All valid communication events in Heloci (single source of truth)
 * Maps to CommunicationRegistry entries
 * Replaces string event names for type safety
 */
export const VALID_COMMUNICATION_EVENTS = [
  "user_registration",
  "user_login",
  "application_submitted",
  "application_approved",
  "application_rejected",
  "application_conditional",
  "application_waitlisted",
  "application_withdrawn",
  "application_under_review",
  "documents_requested",
  "document_approved",
  "document_rejected",
  "document_replacement_requested",
  "eligibility_assessment_completed",
  "recommendation_available",
  "program_matched",
  "program_published",
  "staff_invited",
  "staff_invitation_accepted",
  "staff_role_changed",
  "staff_removed",
  "message_created",
  "admin_action",
  "communication_manual_send",
  "admin_alert_application_submitted",
  "admin_alert_sla_breach",
] as const;

export type CommunicationEvent = typeof VALID_COMMUNICATION_EVENTS[number];

/**
 * Communication Channel - Delivery medium
 */
export const VALID_CHANNELS = [
  "email",
  "telegram",
  "internal",
  "whatsapp",
  "sms",
] as const;

export type CommunicationChannel = typeof VALID_CHANNELS[number];

/**
 * Audience Role - Who receives the communication
 */
export const VALID_AUDIENCE_ROLES = [
  "applicant",
  "org_admin",
  "reviewer",
  "case_worker",
  "support",
  "staff_member",
  "staff_admin",
  "system",
] as const;

export type AudienceRole = typeof VALID_AUDIENCE_ROLES[number];

/**
 * Delivery Status - State of message delivery
 */
export const VALID_DELIVERY_STATUSES = [
  "PENDING",
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "BOUNCED",
  "OPENED",
  "CLICKED",
  "CANCELLED",
] as const;

export type DeliveryStatus = typeof VALID_DELIVERY_STATUSES[number];

/**
 * UTILITY TYPES
 */

/**
 * Deep readonly - Makes entire object and all nested properties readonly
 * Prevents accidental mutation at any depth
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * PROVIDER-NEUTRAL RECIPIENT
 * No provider-specific assumptions or fields
 * Pure domain representation of a person receiving a communication
 */
export interface Recipient {
  readonly id: string; // User ID in Heloci system
  readonly email: string; // Primary contact (can be external)
  readonly name?: string; // Display name
  readonly role: AudienceRole; // Why they're receiving this
  readonly organizationId: string; // Org isolation boundary
  readonly preferences?: RecipientPreferences;
  readonly metadata?: Readonly<Record<string, unknown>>; // Domain-specific data only
}

/**
 * Provider-neutral preferences (no provider-specific fields)
 */
export interface RecipientPreferences {
  readonly enabledChannels?: readonly CommunicationChannel[];
  readonly disabledChannels?: readonly CommunicationChannel[];
  readonly preferredChannelOnly?: boolean;
  readonly language?: string; // ISO 639-1
  readonly timezone?: string;
  readonly doNotDisturb?: {
    readonly enabled: boolean;
    readonly startHour?: number;
    readonly endHour?: number;
  };
  readonly customSettings?: Readonly<Record<string, unknown>>;
}

/**
 * RUNTIME CONTEXT - Shared across all layers
 * Immutable information about the execution environment
 */
export interface CommunicationRuntimeContext {
  readonly traceId: string; // Unique identifier for this communication flow
  readonly organizationId: string; // Org isolation boundary
  readonly userId?: string; // Who triggered this (audit)
  readonly createdAt: Date; // When communication was initiated
  readonly createdBy?: string; // Component that created this
  readonly priority?: "critical" | "high" | "normal" | "low";
  readonly tags?: readonly string[];
  readonly correlationId?: string; // Link to related communications
}

/**
 * COMMUNICATION REQUEST - STAGE 1: Initial Creation
 * ================================================
 * Only contains information known at creation time
 * - Event that occurred
 * - Business data from domain event (immutable, read-only)
 * - Runtime context (tracing, org, user)
 *
 * Does NOT contain: audiences, recipients, channels, template, rendered
 * Those are added by specialized layers
 */
export interface CommunicationRequest {
  // Runtime context (immutable)
  readonly context: CommunicationRuntimeContext;

  // Event context (immutable, read-only)
  readonly event: CommunicationEvent; // Type-safe event name
  readonly eventPayload: DeepReadonly<Record<string, unknown>>; // Business data

  // Marker for serialization
  readonly __stage: "initial";
}

/**
 * AUDIENCE RESOLVED REQUEST - STAGE 2
 * ==================================
 * After C.1: Audience Resolution
 * Adds: audiences and recipients (resolved from domain)
 */
export interface AudienceResolvedRequest {
  readonly context: CommunicationRuntimeContext;
  readonly event: CommunicationEvent;
  readonly eventPayload: DeepReadonly<Record<string, unknown>>;
  readonly audiences: readonly AudienceRole[];
  readonly recipients: readonly Recipient[];
  readonly __stage: "audience_resolved";
}

/**
 * PLANNED COMMUNICATION - STAGE 3
 * ===============================
 * After C.2: Communication Planning
 * Adds: channels and channel plans (from registry + preferences)
 */
export interface PlannedCommunication {
  readonly context: CommunicationRuntimeContext;
  readonly event: CommunicationEvent;
  readonly eventPayload: DeepReadonly<Record<string, unknown>>;
  readonly audiences: readonly AudienceRole[];
  readonly recipients: readonly Recipient[];
  readonly channels: readonly CommunicationChannel[];
  readonly channelPlan: readonly ChannelPlan[];
  readonly __stage: "planned";
}

/**
 * RENDERED COMMUNICATION - STAGE 4
 * ===============================
 * After C.3: Template Resolution
 * Adds: template and rendered content
 * Ready for dispatch
 */
export interface RenderedCommunication {
  readonly context: CommunicationRuntimeContext;
  readonly event: CommunicationEvent;
  readonly eventPayload: DeepReadonly<Record<string, unknown>>;
  readonly audiences: readonly AudienceRole[];
  readonly recipients: readonly Recipient[];
  readonly channels: readonly CommunicationChannel[];
  readonly channelPlan: readonly ChannelPlan[];
  readonly template: Template;
  readonly rendered: RenderedTemplate;
  readonly __stage: "rendered";
}

/**
 * Type-safe helper for union of all stages
 */
export type AnyCommunicationRequest = 
  | CommunicationRequest 
  | AudienceResolvedRequest 
  | PlannedCommunication 
  | RenderedCommunication;

/**
 * Channel Plan - How a specific recipient receives this communication
 */
export interface ChannelPlan {
  readonly recipientId: string;
  readonly primary: CommunicationChannel;
  readonly fallbacks: CommunicationChannel[];
  readonly disabled?: CommunicationChannel[];
  readonly priority?: "critical" | "high" | "normal" | "low";
}

/**
 * Template - Message template definition
 */
export interface Template {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly language: string; // ISO 639-1 code
  readonly channel: CommunicationChannel;
  readonly variables: readonly string[];
  readonly status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

/**
 * Rendered Template - Final rendered message ready to send
 */
export interface RenderedTemplate {
  readonly templateId: string;
  readonly subject?: string; // Email only
  readonly body: string; // Plain text body
  readonly html?: string; // HTML body (email, internal)
  readonly plainText?: string; // Plain text version
  readonly variables: {
    readonly substituted: Record<string, unknown>; // Variables that were substituted
    readonly missing: readonly string[]; // Variables that were missing
  };
}

/**
 * Validation Result - Outcome of contract validation
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Builder Result - Outcome of contract building
 */
export interface BuilderResult {
  readonly success: boolean;
  readonly request?: AnyCommunicationRequest;
  readonly errors: readonly string[];
}
