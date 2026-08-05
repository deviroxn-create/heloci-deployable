/**
 * CANONICAL COMMUNICATION REGISTRY
 * 
 * Single source of truth for all communication events in Heloci.
 * 
 * This is the contract that drives:
 * - NotificationDomainSubscriber (domain → notification event mapping)
 * - AudienceResolver (who receives each event)
 * - CommunicationPlanner (which channels per audience)
 * - TemplateResolver (template selection)
 * - Dispatcher (dispatch rules)
 * 
 * RULE: Every change to communication contract must update this registry first.
 * RULE: Downstream components read from this registry, never hardcode logic.
 * 
 * Last Updated: 2026-07-28
 * Version: 1.0 (Phase A - Definition)
 */

/**
 * All valid audience types in the system
 */
export const VALID_AUDIENCES = [
  'applicant',
  'org_admin',
  'reviewer',
  'case_worker',
  'support',
  'staff_member',
  'staff_admin',
  'system'
] as const;

export type AudienceRole = typeof VALID_AUDIENCES[number];

/**
 * All valid communication channels
 */
export const VALID_CHANNELS = [
  'email',
  'telegram',
  'internal',
  'whatsapp'
] as const;

export type CommunicationChannel = typeof VALID_CHANNELS[number];

/**
 * All valid priority levels
 */
export const VALID_PRIORITIES = [
  'critical',
  'high',
  'normal',
  'low'
] as const;

export type Priority = typeof VALID_PRIORITIES[number];

/**
 * Communication event type (who should receive it)
 */
export type CommunicationType = 'user-facing' | 'staff-facing' | 'system-facing' | 'mixed';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  initialDelayMs?: number;
}

/**
 * Single communication registry entry
 */
export interface CommunicationRegistryEntry {
  /** Unique communication event name (what NotificationService receives) */
  communicationEventName: string;

  /** Domain event that triggers this communication (what business publishes) */
  domainEventName: string;

  /** Audiences who receive this event */
  audiences: AudienceRole[];

  /** Channels each audience can receive via */
  channelsByAudience: Record<AudienceRole, CommunicationChannel[]>;

  /** Who is this communication for? */
  type: CommunicationType;

  /** How urgent is it? */
  priority: Priority;

  /** Retry behavior */
  retry: RetryConfig;

  /** Always async? */
  async: boolean;

  /** Human-readable description */
  description: string;

  /** Any special handling notes */
  notes?: string;

  /** Whether this entry is complete and verified */
  implemented: boolean;
}

/**
 * COMMUNICATION REGISTRY
 * 
 * Key: communicationEventName (what notificationService.notify() receives)
 * Value: Complete configuration for that communication
 * 
 * To add a new communication event:
 * 1. Add entry to this registry with all required fields
 * 2. Ensure domainEventName matches what gets published
 * 3. Set implemented: false until ready
 * 4. Follow validation rules
 */
export const COMMUNICATION_REGISTRY: Record<string, CommunicationRegistryEntry> = {
  // ============================================================================
  // AUTHENTICATION DOMAIN
  // ============================================================================

  user_registration: {
    communicationEventName: 'user_registration',
    domainEventName: 'user.registration',
    audiences: ['applicant', 'org_admin'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['email', 'internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'high',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'New user account created',
    notes: 'Welcome email includes onboarding link',
    implemented: true
  },

  user_login: {
    communicationEventName: 'user_login',
    domainEventName: 'user.login',
    audiences: ['applicant', 'org_admin'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'normal',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'User authenticated',
    notes: 'Optional security alert; can be disabled per user',
    implemented: true
  },

  // ============================================================================
  // APPLICATION DOMAIN
  // ============================================================================

  application_submitted: {
    communicationEventName: 'application_submitted',
    domainEventName: 'application.submitted',
    audiences: ['applicant', 'org_admin', 'reviewer', 'case_worker', 'support'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['telegram', 'internal'],
      reviewer: ['internal'],
      case_worker: ['internal'],
      support: ['email'],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'mixed',
    priority: 'critical',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Application submitted by applicant',
    notes: 'Triggers workflow engine; also sends Telegram admin alert',
    implemented: true
  },

  application_approved: {
    communicationEventName: 'application_approved',
    domainEventName: 'application.approved',
    audiences: ['applicant', 'org_admin', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['telegram', 'internal'],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'critical',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Application approved by reviewer',
    notes: 'May trigger next-step workflows',
    implemented: true
  },

  application_rejected: {
    communicationEventName: 'application_rejected',
    domainEventName: 'application.rejected',
    audiences: ['applicant', 'org_admin', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['telegram', 'internal'],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'critical',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Application rejected by reviewer',
    notes: 'May include rejection reason',
    implemented: true
  },

  application_conditional: {
    communicationEventName: 'application_conditional',
    domainEventName: 'application.review.completed',
    audiences: ['applicant', 'org_admin', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['internal'],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'high',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Conditional approval with requirements',
    notes: 'Includes conditions applicant must meet',
    implemented: true
  },

  application_waitlisted: {
    communicationEventName: 'application_waitlisted',
    domainEventName: 'application.waitlisted',
    audiences: ['applicant', 'org_admin', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['telegram', 'internal'],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'high',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Application added to waitlist',
    notes: 'Includes position and estimated timeline',
    implemented: true
  },

  application_withdrawn: {
    communicationEventName: 'application_withdrawn',
    domainEventName: 'application.withdrawn',
    audiences: ['applicant', 'org_admin', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['internal'],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'normal',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Application withdrawn by applicant',
    notes: 'May trigger cleanup workflows',
    implemented: true
  },

  application_under_review: {
    communicationEventName: 'application_under_review',
    domainEventName: 'application.under_review',
    audiences: ['applicant', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: [],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'normal',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Application entered review state',
    notes: 'Status update; can be suppressed if too noisy',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  // ============================================================================
  // DOCUMENT DOMAIN
  // ============================================================================

  documents_requested: {
    communicationEventName: 'documents_requested',
    domainEventName: 'documents.requested',
    audiences: ['applicant', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: [],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'critical',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Documents requested from applicant',
    notes: 'Includes document types and deadline',
    implemented: true
  },

  document_approved: {
    communicationEventName: 'document_approved',
    domainEventName: 'document.approved',
    audiences: ['applicant', 'org_admin', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['internal'],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'normal',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Document approved by reviewer',
    notes: 'May include next steps',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  document_rejected: {
    communicationEventName: 'document_rejected',
    domainEventName: 'document.rejected',
    audiences: ['applicant', 'org_admin', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['internal'],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'high',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Document rejected by reviewer',
    notes: 'Includes rejection reason and resubmission instructions',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  document_replacement_requested: {
    communicationEventName: 'document_replacement_requested',
    domainEventName: 'document.replacement.requested',
    audiences: ['applicant', 'reviewer'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: [],
      reviewer: ['internal'],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'high',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Document replacement requested',
    notes: 'Includes replacement deadline',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  // ============================================================================
  // ELIGIBILITY DOMAIN
  // ============================================================================

  eligibility_assessment_completed: {
    communicationEventName: 'eligibility_assessment_completed',
    domainEventName: 'eligibility.assessed',
    audiences: ['applicant', 'org_admin'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'normal',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Eligibility assessment complete',
    notes: 'May include matched programs; often suppressed if no matches',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  // ============================================================================
  // MATCHING DOMAIN
  // ============================================================================

  recommendation_available: {
    communicationEventName: 'recommendation_available',
    domainEventName: 'recommendation.available',
    audiences: ['applicant', 'org_admin'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'normal',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'New recommendation available',
    notes: 'May include recommendation details',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  program_matched: {
    communicationEventName: 'program_matched',
    domainEventName: 'program.matched',
    audiences: ['applicant', 'org_admin'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'high',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Applicant matched to program',
    notes: 'Includes program details and application link',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  // ============================================================================
  // PROGRAM DOMAIN
  // ============================================================================

  program_published: {
    communicationEventName: 'program_published',
    domainEventName: 'program.published',
    audiences: ['org_admin'],
    channelsByAudience: {
      applicant: [],
      org_admin: ['telegram', 'internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'staff-facing',
    priority: 'normal',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'New program published',
    notes: 'Internal notification; staff needs to know new program is live',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  // ============================================================================
  // ORGANIZATION DOMAIN
  // ============================================================================

  staff_invited: {
    communicationEventName: 'staff_invited',
    domainEventName: 'staff.invited',
    audiences: ['staff_member'],
    channelsByAudience: {
      applicant: [],
      org_admin: [],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: ['email'],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'critical',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Staff member invited to organization',
    notes: 'Includes acceptance link and expiration time; can be resent',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  staff_invitation_accepted: {
    communicationEventName: 'staff_invitation_accepted',
    domainEventName: 'staff.invitation.accepted',
    audiences: ['org_admin'],
    channelsByAudience: {
      applicant: [],
      org_admin: ['email', 'telegram', 'internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'staff-facing',
    priority: 'normal',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Staff member accepted invitation',
    notes: 'Alerts org admin that new staff is available',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  staff_role_changed: {
    communicationEventName: 'staff_role_changed',
    domainEventName: 'staff.role.changed',
    audiences: ['staff_member', 'org_admin'],
    channelsByAudience: {
      applicant: [],
      org_admin: ['telegram', 'internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: ['email', 'telegram', 'internal'],
      staff_admin: [],
      system: []
    },
    type: 'staff-facing',
    priority: 'high',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Staff role changed',
    notes: 'May affect permissions and access; notify both staff and admin',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  staff_removed: {
    communicationEventName: 'staff_removed',
    domainEventName: 'staff.removed',
    audiences: ['staff_member', 'org_admin'],
    channelsByAudience: {
      applicant: [],
      org_admin: ['telegram', 'internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: ['email', 'telegram', 'internal'],
      staff_admin: [],
      system: []
    },
    type: 'staff-facing',
    priority: 'high',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Staff member removed',
    notes: 'May require offboarding workflow',
    implemented: true  // PHASE B: Now subscribed via registry
  },

  // ============================================================================
  // COMMUNICATION DOMAIN
  // ============================================================================

  message_created: {
    communicationEventName: 'message_created',
    domainEventName: 'message.created',
    audiences: ['applicant', 'org_admin'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'user-facing',
    priority: 'high',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'New message in case conversation',
    notes: 'Can be suppressed per recipient preferences; include preview',
    implemented: true
  },

  admin_action: {
    communicationEventName: 'admin_action',
    domainEventName: 'admin.action',
    audiences: ['applicant', 'org_admin', 'reviewer', 'case_worker'],
    channelsByAudience: {
      applicant: ['email', 'internal'],
      org_admin: ['telegram', 'internal'],
      reviewer: ['internal'],
      case_worker: ['internal'],
      support: [],
      staff_member: [],
      staff_admin: [],
      system: []
    },
    type: 'staff-facing',
    priority: 'normal',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Administrative action',
    notes: 'Catch-all event for workflow triggers; template varies by action',
    implemented: true
  },

  communication_manual_send: {
    communicationEventName: 'communication_manual_send',
    domainEventName: 'communication.manual_send',
    audiences: ['org_admin', 'staff_member'],
    channelsByAudience: {
      applicant: [],
      org_admin: ['email', 'telegram', 'internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: ['email', 'telegram', 'internal'],
      staff_admin: [],
      system: []
    },
    type: 'staff-facing',
    priority: 'normal',
    retry: { maxAttempts: 5, backoffStrategy: 'exponential' },
    async: true,
    description: 'Manual communication sent via dashboard',
    notes: 'Replaces direct notify() calls; provides full audit trail',
    implemented: false
  },

  // ============================================================================
  // ADMIN ALERT DOMAIN (CURRENTLY BROKEN - BEING REARCHITECTED)
  // ============================================================================

  admin_alert_application_submitted: {
    communicationEventName: 'admin_alert_application_submitted',
    domainEventName: 'admin.alert.application_submitted',
    audiences: ['org_admin', 'staff_admin'],
    channelsByAudience: {
      applicant: [],
      org_admin: ['telegram', 'internal'],
      reviewer: [],
      case_worker: [],
      support: [],
      staff_member: [],
      staff_admin: ['telegram', 'internal'],
      system: []
    },
    type: 'system-facing',
    priority: 'critical',
    retry: { maxAttempts: 3, backoffStrategy: 'exponential' },
    async: true,
    description: 'Application submitted alert',
    notes: 'System alert sent to org admins; being migrated from direct Telegram API',
    implemented: false
  }
};

/**
 * HELPER FUNCTIONS
 * 
 * These functions allow downstream components to query the registry
 * without hardcoding logic.
 */

/**
 * Get all communication events from the registry
 */
export function getAllCommunicationEvents(): string[] {
  return Object.keys(COMMUNICATION_REGISTRY);
}

/**
 * Look up registry entry by communication event name
 */
export function getRegistryEntry(communicationEventName: string): CommunicationRegistryEntry | undefined {
  return COMMUNICATION_REGISTRY[communicationEventName];
}

/**
 * Get all domain events that map to communication events
 */
export function getAllDomainEvents(): string[] {
  return Array.from(new Set(
    Object.values(COMMUNICATION_REGISTRY).map(entry => entry.domainEventName)
  ));
}

/**
 * Look up communication event by domain event name
 */
export function getCommunicationEventForDomainEvent(domainEventName: string): string | undefined {
  const entry = Object.values(COMMUNICATION_REGISTRY).find(
    e => e.domainEventName === domainEventName
  );
  return entry?.communicationEventName;
}

/**
 * Get all audiences for a communication event
 */
export function getAudiencesForEvent(communicationEventName: string): AudienceRole[] {
  return getRegistryEntry(communicationEventName)?.audiences || [];
}

/**
 * Get all channels for an audience in a specific event
 */
export function getChannelsForAudience(
  communicationEventName: string,
  audience: AudienceRole
): CommunicationChannel[] {
  const entry = getRegistryEntry(communicationEventName);
  return entry?.channelsByAudience[audience] || [];
}

/**
 * Get all implemented communication events
 */
export function getImplementedEvents(): string[] {
  return Object.entries(COMMUNICATION_REGISTRY)
    .filter(([_, entry]) => entry.implemented)
    .map(([name, _]) => name);
}

/**
 * Get all unimplemented communication events (Phase B, C, D, E)
 */
export function getUnimplementedEvents(): string[] {
  return Object.entries(COMMUNICATION_REGISTRY)
    .filter(([_, entry]) => !entry.implemented)
    .map(([name, _]) => name);
}

/**
 * Validate that all registry entries are self-consistent
 */
export function validateRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenDomainEvents = new Set<string>();
  const seenCommunicationEvents = new Set<string>();

  for (const [name, entry] of Object.entries(COMMUNICATION_REGISTRY)) {
    // Check for duplicate communication event names
    if (seenCommunicationEvents.has(entry.communicationEventName)) {
      errors.push(`Duplicate communication event: ${entry.communicationEventName}`);
    }
    seenCommunicationEvents.add(entry.communicationEventName);

    // Check for duplicate domain event names (unless intentional)
    if (seenDomainEvents.has(entry.domainEventName)) {
      // Multiple communication events from same domain event would be aliasing
      // This is allowed but unusual
    }
    seenDomainEvents.add(entry.domainEventName);

    // Validate audiences
    for (const audience of entry.audiences) {
      if (!VALID_AUDIENCES.includes(audience)) {
        errors.push(`Invalid audience in ${entry.communicationEventName}: ${audience}`);
      }

      // Validate channels for this audience
      const channels = entry.channelsByAudience[audience] || [];
      for (const channel of channels) {
        if (!VALID_CHANNELS.includes(channel)) {
          errors.push(`Invalid channel in ${entry.communicationEventName} for ${audience}: ${channel}`);
        }
      }
    }

    // Validate priority
    if (!VALID_PRIORITIES.includes(entry.priority)) {
      errors.push(`Invalid priority in ${entry.communicationEventName}: ${entry.priority}`);
    }

    // Validate retry config
    if (entry.retry.maxAttempts < 1) {
      errors.push(`Invalid maxAttempts in ${entry.communicationEventName}: ${entry.retry.maxAttempts}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
