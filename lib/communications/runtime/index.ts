/**
 * RUNTIME - PHASE C EXECUTION LAYER
 * ================================
 * Progressive enrichment of CommunicationRequest through multiple layers.
 *
 * Phase C.1 - Audience Resolution (this phase)
 * Phase C.2 - Communication Planning (future)
 * Phase C.3 - Template Resolution (future)
 * Phase C.4 - Dispatcher (future)
 */

// Phase C.1 - Audience Resolution
export { AudienceResolver } from "./AudienceResolver";
export { AudienceResolutionService } from "./AudienceResolutionService";
export { type AudienceResolutionResult, AudienceResolutionResultFactory } from "./AudienceResolutionResult";
export {
  AudienceResolutionError,
  OrganizationNotFoundError,
  OrganizationInactiveError,
  ApplicationNotFoundError,
  UserNotFoundError,
  UserInactiveError,
  CaseNotFoundError,
  CaseWorkerNotAssignedError,
  ReviewerNotAssignedError,
  PermissionDeniedError,
  InvalidAudienceRoleError,
  NoRecipientsFoundError,
  InvalidEmailError,
  CrossOrganizationAccessError,
  RegistryEntryNotFoundError,
  InvalidPayloadError,
} from "./AudienceResolutionErrors";
