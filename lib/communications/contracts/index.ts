/**
 * COMMUNICATION CONTRACTS - HARDENED ARCHITECTURE
 * ================================================
 * Frozen architectural contract for all communication runtime layers.
 * K1.C0 Hardening Pass - Progressive Enrichment Model
 *
 * This module exports the immutable contract that every communication
 * must conform to. No layer may modify these contracts.
 *
 * NEW ARCHITECTURE: Use ProgressiveEnrichmentFactory for building
 * (The legacy CommunicationRequestBuilder is deprecated)
 */

// === CORE TYPES ===
export type {
  CommunicationEvent,
  CommunicationChannel,
  AudienceRole,
  DeliveryStatus,
  Recipient,
  RecipientPreferences,
  CommunicationRuntimeContext,
  ChannelPlan,
  Template,
  RenderedTemplate,
  CommunicationRequest,
  AudienceResolvedRequest,
  PlannedCommunication,
  RenderedCommunication,
  AnyCommunicationRequest,
  ValidationResult,
  BuilderResult,
  DeepReadonly,
} from "./CommunicationTypes";

export {
  VALID_COMMUNICATION_EVENTS,
  VALID_CHANNELS,
  VALID_AUDIENCE_ROLES,
  VALID_DELIVERY_STATUSES,
} from "./CommunicationTypes";

// === RECIPIENT ===
export { RecipientFactory, RecipientValidator } from "./Recipient";

// === CHANNEL PLAN ===
export { ChannelPlanFactory, ChannelPlanValidator } from "./ChannelPlan";

// === RENDERED TEMPLATE ===
export { RenderedTemplateFactory, RenderedTemplateValidator } from "./RenderedTemplate";

// === PROGRESSIVE ENRICHMENT BUILDERS (PRIMARY ARCHITECTURE) ===
// Use these for all new code
export {
  InitialRequestBuilder,
  AudienceResolvedBuilder,
  CommunicationPlannerBuilder,
  TemplateResolutionBuilder,
  ProgressiveEnrichmentFactory,
} from "./ProgressiveEnrichmentBuilders";
