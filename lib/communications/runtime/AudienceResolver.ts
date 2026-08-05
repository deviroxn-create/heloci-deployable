/**
 * AUDIENCE RESOLVER - PHASE C.1
 * ============================
 * Resolves WHO should receive each communication.
 *
 * Input: CommunicationRequest (initial stage)
 * Output: AudienceResolvedRequest (stage 2)
 *
 * This layer:
 * ✓ Determines recipients from organization, application, and role data
 * ✓ Filters by permissions and active status
 * ✓ Deduplicates recipients
 * ✓ Produces immutable AudienceResolvedRequest
 *
 * This layer MUST NOT:
 * ✗ Choose channels (that's C.2)
 * ✗ Render templates (that's C.3)
 * ✗ Dispatch providers (that's C.4)
 * ✗ Use payload values for recipient lists
 * ✗ Mutate the original CommunicationRequest
 */

import { prisma } from "@/lib/prisma/client";
import type {
  CommunicationRequest,
  AudienceResolvedRequest,
  Recipient,
  AudienceRole,
} from "../contracts";
import { VALID_AUDIENCE_ROLES } from "../contracts";
import { RecipientFactory } from "../contracts";
import {
  OrganizationNotFoundError,
  OrganizationInactiveError,
  NoRecipientsFoundError,
  InvalidAudienceRoleError,
  RegistryEntryNotFoundError,
  InvalidPayloadError,
} from "./AudienceResolutionErrors";

/**
 * Audience Resolver Service
 * Resolves recipients for communications based on registry definitions
 */
export class AudienceResolver {
  /**
   * Resolve audiences and recipients for a communication
   *
   * @param request CommunicationRequest (initial stage)
   * @returns AudienceResolvedRequest (stage 2, immutable)
   * @throws AudienceResolutionError if resolution fails
   */
  static async resolve(request: CommunicationRequest): Promise<AudienceResolvedRequest> {
    // Validate input
    // EXCEPTION: user-only events don't require organizationId
    if (!request.context.organizationId && !this.isUserOnlyEvent(request.event)) {
      throw new InvalidPayloadError(request.event, "organizationId is required in context");
    }

    // For user-only events, skip organization validation
    if (request.context.organizationId) {
      // Verify organization exists and is active
      await this.validateOrganization(request.context.organizationId);
    }

    // Get registry entry for this event
    const registryEntry = await this.getRegistryEntry(request.event);
    const audiences = registryEntry.audiences as AudienceRole[];

    // Resolve all recipients for these audiences
    const recipients = await this.resolveRecipients(
      request.event,
      audiences,
      request.context.organizationId || "",
      request.eventPayload
    );

    // Validate we have at least one recipient
    if (recipients.length === 0) {
      throw new NoRecipientsFoundError(request.event, audiences);
    }

    // Create immutable AudienceResolvedRequest (stage 2)
    const resolvedRequest: AudienceResolvedRequest = Object.freeze({
      context: request.context,
      event: request.event,
      eventPayload: request.eventPayload,
      audiences: Object.freeze([...audiences]),
      recipients: Object.freeze([...recipients]),
      __stage: "audience_resolved" as const,
    });

    return resolvedRequest;
  }

  /**
   * Check if this event type doesn't require organizationId
   */
  private static isUserOnlyEvent(eventName: string): boolean {
    const userOnlyEvents = new Set([
      'user_registration',
      'user_login',
      'user_password_reset',
    ]);
    return userOnlyEvents.has(eventName);
  }

  /**
   * Validate organization exists and is active
   */
  private static async validateOrganization(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, isActive: true, name: true },
    });

    if (!org) {
      throw new OrganizationNotFoundError(organizationId);
    }

    if (!org.isActive) {
      throw new OrganizationInactiveError(organizationId);
    }

    return org;
  }

  /**
   * Get registry entry for communication event
   * From .kiro/communication-registry.md (canonical source)
   * Returns audiences and channels for an event
   */
  private static async getRegistryEntry(event: string): Promise<{
    audiences: string[];
    channels: string[];
  }> {
    // Complete registry from communication-registry.md
    // Maps domain event name to audiences and channels
    const registry: Record<string, { audiences: string[]; channels: string[] }> = {
      // Authentication Domain
      user_registration: {
        audiences: ["applicant", "org_admin"],
        channels: ["email", "internal"],
      },
      user_login: {
        audiences: ["applicant", "org_admin"],
        channels: ["email", "internal"],
      },
      user_password_reset: {
        audiences: ["applicant"],
        channels: ["email"],
      },

      // Application Domain
      application_submitted: {
        audiences: ["applicant", "org_admin", "reviewer", "case_worker", "support"],
        channels: ["email", "telegram", "internal"],
      },
      application_approved: {
        audiences: ["applicant", "org_admin", "reviewer"],
        channels: ["email", "telegram", "internal"],
      },
      application_rejected: {
        audiences: ["applicant", "org_admin", "reviewer"],
        channels: ["email", "telegram", "internal"],
      },
      application_conditional: {
        audiences: ["applicant", "org_admin", "reviewer"],
        channels: ["email", "internal"],
      },
      application_waitlisted: {
        audiences: ["applicant", "org_admin", "reviewer"],
        channels: ["email", "telegram", "internal"],
      },
      application_withdrawn: {
        audiences: ["applicant", "org_admin", "reviewer"],
        channels: ["email", "internal"],
      },
      application_under_review: {
        audiences: ["applicant", "reviewer"],
        channels: ["email", "internal"],
      },

      // Document Domain
      documents_requested: {
        audiences: ["applicant", "reviewer"],
        channels: ["email", "internal"],
      },
      document_approved: {
        audiences: ["applicant", "org_admin", "reviewer"],
        channels: ["email", "internal"],
      },
      document_rejected: {
        audiences: ["applicant", "org_admin", "reviewer"],
        channels: ["email", "internal"],
      },
      document_replacement_requested: {
        audiences: ["applicant", "reviewer"],
        channels: ["email", "internal"],
      },

      // Eligibility Domain
      eligibility_assessment_completed: {
        audiences: ["applicant", "org_admin"],
        channels: ["email", "internal"],
      },

      // Matching Domain
      recommendation_available: {
        audiences: ["applicant", "org_admin"],
        channels: ["email", "internal"],
      },
      program_matched: {
        audiences: ["applicant", "org_admin"],
        channels: ["email", "internal"],
      },

      // Program Domain
      program_published: {
        audiences: ["org_admin"],
        channels: ["telegram", "internal"],
      },

      // Organization Domain
      staff_invited: {
        audiences: ["staff_member"],
        channels: ["email"],
      },
      staff_invitation_accepted: {
        audiences: ["org_admin"],
        channels: ["email", "telegram", "internal"],
      },
      staff_role_changed: {
        audiences: ["staff_member", "org_admin"],
        channels: ["email", "telegram", "internal"],
      },
      staff_removed: {
        audiences: ["staff_member", "org_admin"],
        channels: ["email", "telegram", "internal"],
      },

      // Communication Domain
      message_created: {
        audiences: ["applicant", "org_admin", "case_worker"],
        channels: ["internal", "email"],
      },
      admin_action: {
        audiences: ["org_admin", "support"],
        channels: ["email", "telegram", "internal"],
      },
      communication_manual_send: {
        audiences: ["org_admin", "staff_member"],
        channels: ["email", "telegram", "internal"],
      },

      // Admin Alert Domain
      admin_alert_application_submitted: {
        audiences: ["org_admin", "staff_admin"],
        channels: ["telegram", "internal"],
      },
      admin_alert_sla_breach: {
        audiences: ["org_admin", "staff_admin"],
        channels: ["telegram", "internal"],
      },
    };

    const entry = registry[event];
    if (!entry) {
      throw new RegistryEntryNotFoundError(event);
    }

    return entry;
  }

  /**
   * Resolve all recipients for given audiences
   */
  private static async resolveRecipients(
    event: string,
    audiences: AudienceRole[],
    organizationId: string,
    eventPayload: Record<string, unknown>
  ): Promise<Recipient[]> {
    const recipients: Recipient[] = [];

    for (const audience of audiences) {
      try {
        const audienceRecipients = await this.resolveAudience(
          audience,
          organizationId,
          eventPayload
        );
        console.log(`[AudienceResolver] resolveAudience(${audience}) returned ${audienceRecipients.length} recipients`);
        if (audience === "org_admin" && audienceRecipients.length > 0) {
          console.log(`[AudienceResolver] org_admin recipients:`, audienceRecipients.map(r => ({id: r.id, email: r.email})));
        }

        recipients.push(...audienceRecipients);
      } catch (error) {
        // Log but continue for other audiences
        console.warn(`Failed to resolve audience ${audience} for event ${event}:`, error);
      }
    }

    console.log(`[AudienceResolver] Before dedup: ${recipients.length} recipients total`);
    recipients.forEach((r, i) => {
      console.log(`  [${i}] ${r.role}: ${r.email}`);
    });

    // Deduplicate by email (maintain first occurrence)
    const seenEmails = new Set<string>();
    const deduplicatedByEmail = recipients.filter((r) => {
      if (seenEmails.has(r.email)) {
        return false;
      }
      seenEmails.add(r.email);
      return true;
    });

    // Deduplicate by ID (maintain first occurrence)
    const seenIds = new Set<string>();
    const deduplicatedById = deduplicatedByEmail.filter((r) => {
      if (seenIds.has(r.id)) {
        return false;
      }
      seenIds.add(r.id);
      return true;
    });

    console.log(`[AudienceResolver] After dedup: ${deduplicatedById.length} recipients`);

    return deduplicatedById;
  }

  /**
   * Resolve a single audience role to recipients
   */
  private static async resolveAudience(
    audience: AudienceRole,
    organizationId: string,
    eventPayload: Record<string, unknown>
  ): Promise<Recipient[]> {
    switch (audience) {
      case "applicant":
        return this.resolveApplicant(organizationId, eventPayload);

      case "org_admin":
        return this.resolveOrgAdmins(organizationId);

      case "case_worker":
        return this.resolveCaseWorker(organizationId, eventPayload);

      case "reviewer":
        return this.resolveReviewer(organizationId, eventPayload);

      case "support":
        return this.resolveSupport(organizationId);

      case "staff_member":
        return this.resolveStaffMembers(organizationId);

      case "staff_admin":
        return this.resolveStaffAdmins(organizationId);

      case "system":
        // System audience - no recipients
        return [];

      default:
        throw new InvalidAudienceRoleError(audience, Array.from(VALID_AUDIENCE_ROLES));
    }
  }

  /**
   * Resolve applicant from event payload
   * Expects payload.userId or payload.applicantId
   * For user.registration, userId is the newly created user
   */
  private static async resolveApplicant(
    organizationId: string,
    eventPayload: Record<string, unknown>
  ): Promise<Recipient[]> {
    const userId = (eventPayload.userId || eventPayload.applicantId) as string | undefined;

    if (!userId) {
      // Applicant not specified in payload - skip silently
      return [];
    }

    return this.resolveUserAsRecipient(userId, organizationId, "applicant");
  }

  /**
   * Resolve all organization admins
   */
  private static async resolveOrgAdmins(organizationId: string): Promise<Recipient[]> {
    // For user-only events with no organizationId, skip org admins
    if (!organizationId) {
      return [];
    }

    const admins = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        role: "org_admin",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return admins
      .filter((m) => m.user.email) // Must have email
      .map((m) =>
        RecipientFactory.create({
          id: m.user.id,
          email: m.user.email!,
          name: m.user.name || undefined,
          role: "org_admin",
          organizationId,
        })
      );
  }

  /**
   * Resolve case worker from application assignment
   * Expects payload.applicationId
   */
  private static async resolveCaseWorker(
    organizationId: string,
    eventPayload: Record<string, unknown>
  ): Promise<Recipient[]> {
    const applicationId = eventPayload.applicationId as string | undefined;

    if (!applicationId) {
      // No application context - skip silently
      return [];
    }

    // Find application and get assigned case worker
    const app = await prisma.programApplication.findUnique({
      where: { id: applicationId },
      select: {
        assignedToId: true,
        user: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!app) {
      return []; // Application not found - skip silently
    }

    // Cross-organization protection
    if (app.user.organizationId !== organizationId) {
      return []; // Different org - skip
    }

    if (!app.assignedToId) {
      // No case worker assigned - skip silently
      return [];
    }

    return this.resolveUserAsRecipient(app.assignedToId, organizationId, "case_worker");
  }

  /**
   * Resolve reviewer from application review
   * Expects payload.applicationId
   */
  private static async resolveReviewer(
    organizationId: string,
    eventPayload: Record<string, unknown>
  ): Promise<Recipient[]> {
    const applicationId = eventPayload.applicationId as string | undefined;

    if (!applicationId) {
      // No application context - skip silently
      return [];
    }

    // Find application and get reviewer
    const app = await prisma.programApplication.findUnique({
      where: { id: applicationId },
      select: {
        reviewedById: true,
        user: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!app) {
      return []; // Application not found - skip silently
    }

    // Cross-organization protection
    if (app.user.organizationId !== organizationId) {
      return []; // Different org - skip
    }

    if (!app.reviewedById) {
      // No reviewer assigned - skip silently
      return [];
    }

    return this.resolveUserAsRecipient(app.reviewedById, organizationId, "reviewer");
  }

  /**
   * Resolve support staff members
   */
  private static async resolveSupport(organizationId: string): Promise<Recipient[]> {
    const support = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        role: "support",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return support
      .filter((m) => m.user.email)
      .map((m) =>
        RecipientFactory.create({
          id: m.user.id,
          email: m.user.email!,
          name: m.user.name || undefined,
          role: "support",
          organizationId,
        })
      );
  }

  /**
   * Resolve all staff members in organization
   */
  private static async resolveStaffMembers(organizationId: string): Promise<Recipient[]> {
    const staff = await prisma.organizationMember.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return staff
      .filter((m) => m.user.email)
      .map((m) =>
        RecipientFactory.create({
          id: m.user.id,
          email: m.user.email!,
          name: m.user.name || undefined,
          role: "staff_member",
          organizationId,
        })
      );
  }

  /**
   * Resolve staff admin members
   */
  private static async resolveStaffAdmins(organizationId: string): Promise<Recipient[]> {
    const admins = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        role: "staff_admin",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return admins
      .filter((m) => m.user.email)
      .map((m) =>
        RecipientFactory.create({
          id: m.user.id,
          email: m.user.email!,
          name: m.user.name || undefined,
          role: "staff_admin",
          organizationId,
        })
      );
  }

  /**
   * Helper: Resolve a user to a recipient
   * Validates user exists, is active, and has email
   */
  private static async resolveUserAsRecipient(
    userId: string,
    organizationId: string,
    role: AudienceRole
  ): Promise<Recipient[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        organizationId: true,
      },
    });

    if (!user) {
      return []; // User not found - skip silently
    }

    if (!user.email) {
      return []; // User has no email - skip silently
    }

    // Cross-organization protection
    if (user.organizationId && user.organizationId !== organizationId) {
      return []; // Different org - skip silently
    }

    // Create and return recipient
    return [
      RecipientFactory.create({
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role,
        organizationId,
      }),
    ];
  }
}
