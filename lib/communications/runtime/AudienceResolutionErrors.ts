/**
 * AUDIENCE RESOLUTION ERROR TYPES
 * ==============================
 * Explicit, typed errors for audience resolution layer.
 * Used for clear error handling and audit trails.
 */

/**
 * Base error class for audience resolution
 */
export class AudienceResolutionError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AudienceResolutionError";
  }
}

/**
 * Organization not found in database
 */
export class OrganizationNotFoundError extends AudienceResolutionError {
  constructor(organizationId: string) {
    super(
      "ORGANIZATION_NOT_FOUND",
      `Organization not found: ${organizationId}`,
      { organizationId }
    );
  }
}

/**
 * Organization is inactive or deleted
 */
export class OrganizationInactiveError extends AudienceResolutionError {
  constructor(organizationId: string) {
    super(
      "ORGANIZATION_INACTIVE",
      `Organization is inactive: ${organizationId}`,
      { organizationId }
    );
  }
}

/**
 * Application not found in database
 */
export class ApplicationNotFoundError extends AudienceResolutionError {
  constructor(applicationId: string) {
    super(
      "APPLICATION_NOT_FOUND",
      `Application not found: ${applicationId}`,
      { applicationId }
    );
  }
}

/**
 * User not found in database
 */
export class UserNotFoundError extends AudienceResolutionError {
  constructor(userId: string) {
    super(
      "USER_NOT_FOUND",
      `User not found: ${userId}`,
      { userId }
    );
  }
}

/**
 * User is inactive or deleted
 */
export class UserInactiveError extends AudienceResolutionError {
  constructor(userId: string, reason?: string) {
    super(
      "USER_INACTIVE",
      `User is inactive: ${userId}${reason ? ` (${reason})` : ""}`,
      { userId, reason }
    );
  }
}

/**
 * Case not found or not assigned
 */
export class CaseNotFoundError extends AudienceResolutionError {
  constructor(applicationId: string) {
    super(
      "CASE_NOT_FOUND",
      `Case not found for application: ${applicationId}`,
      { applicationId }
    );
  }
}

/**
 * Case worker not assigned to case
 */
export class CaseWorkerNotAssignedError extends AudienceResolutionError {
  constructor(applicationId: string) {
    super(
      "CASE_WORKER_NOT_ASSIGNED",
      `No case worker assigned to application: ${applicationId}`,
      { applicationId }
    );
  }
}

/**
 * Reviewer not assigned to case
 */
export class ReviewerNotAssignedError extends AudienceResolutionError {
  constructor(applicationId: string) {
    super(
      "REVIEWER_NOT_ASSIGNED",
      `No reviewer assigned to application: ${applicationId}`,
      { applicationId }
    );
  }
}

/**
 * Permission denied for audience resolution
 */
export class PermissionDeniedError extends AudienceResolutionError {
  constructor(userId: string, reason: string) {
    super(
      "PERMISSION_DENIED",
      `Permission denied for user ${userId}: ${reason}`,
      { userId, reason }
    );
  }
}

/**
 * Invalid audience role requested
 */
export class InvalidAudienceRoleError extends AudienceResolutionError {
  constructor(role: string, validRoles: string[]) {
    super(
      "INVALID_AUDIENCE_ROLE",
      `Invalid audience role: ${role}. Valid roles: ${validRoles.join(", ")}`,
      { role, validRoles }
    );
  }
}

/**
 * No recipients found for communication
 */
export class NoRecipientsFoundError extends AudienceResolutionError {
  constructor(event: string, audiences: string[]) {
    super(
      "NO_RECIPIENTS_FOUND",
      `No recipients found for event ${event} with audiences: ${audiences.join(", ")}`,
      { event, audiences }
    );
  }
}

/**
 * Invalid email address format
 */
export class InvalidEmailError extends AudienceResolutionError {
  constructor(email: string) {
    super(
      "INVALID_EMAIL",
      `Invalid email address: ${email}`,
      { email }
    );
  }
}

/**
 * Cross-organization access attempt (security violation)
 */
export class CrossOrganizationAccessError extends AudienceResolutionError {
  constructor(requestedOrgId: string, userOrgId: string) {
    super(
      "CROSS_ORGANIZATION_ACCESS",
      `Cross-organization access attempt: requested ${requestedOrgId}, user in ${userOrgId}`,
      { requestedOrgId, userOrgId }
    );
  }
}

/**
 * Registry entry not found for event
 */
export class RegistryEntryNotFoundError extends AudienceResolutionError {
  constructor(event: string) {
    super(
      "REGISTRY_ENTRY_NOT_FOUND",
      `No registry entry found for event: ${event}`,
      { event }
    );
  }
}

/**
 * Invalid event payload format
 */
export class InvalidPayloadError extends AudienceResolutionError {
  constructor(event: string, reason: string) {
    super(
      "INVALID_PAYLOAD",
      `Invalid payload for event ${event}: ${reason}`,
      { event, reason }
    );
  }
}
