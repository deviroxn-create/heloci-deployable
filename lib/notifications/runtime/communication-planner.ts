import type { Audience } from "./audience.types";
import type { CommunicationPlan } from "./communication-plan.types";

export class CommunicationPlanner {
  plan(eventName: string, audiences?: Audience[] | null): CommunicationPlan[] {
    if (!Array.isArray(audiences) || audiences.length === 0) {
      return [];
    }

    // Debug logging
    const audiencesText = audiences.map(a => a.role).join(',');
    console.log(`[CommunicationPlanner] plan() called with eventName=${eventName}, audiences=${audiencesText}`);

    const plans = this.buildPlans(eventName, audiences);
    console.log(`[CommunicationPlanner.buildPlans] eventName=${eventName}, handling ${audiences.length} audiences`);
    const dedupPlans = this.deduplicatePlans(plans);
    console.log(`[CommunicationPlanner] plan() buildPlans returned ${plans.length} plans, after dedup: ${dedupPlans.length}`);
    return dedupPlans;
  }

  private buildPlans(eventName: string, audiences: Audience[]): CommunicationPlan[] {
    const order = ["applicant", "organization_admin", "reviewer", "case_worker", "support", "system", "staff_member", "staff_admin"] as const;
    const sortedAudiences = [...audiences].sort((left, right) => {
      const leftIndex = order.indexOf(left.role as (typeof order)[number]);
      const rightIndex = order.indexOf(right.role as (typeof order)[number]);
      const leftValue = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const rightValue = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
      return leftValue - rightValue;
    });

    switch (eventName) {
      case "application_submitted":
        return sortedAudiences.flatMap((audience) => this.buildApplicationSubmittedPlans(audience));
      case "application_approved":
      case "application_rejected":
      case "application_conditional":
      case "application_waitlisted":
      case "application_withdrawn":
      case "application_under_review":
        return sortedAudiences.flatMap((audience) => this.buildApplicationEventPlans(eventName, audience));
      case "documents_requested":
      case "document_approved":
      case "document_rejected":
      case "document_replacement_requested":
        return sortedAudiences.flatMap((audience) => this.buildDocumentEventPlans(eventName, audience));
      case "eligibility_assessment_completed":
        return sortedAudiences.flatMap((audience) => this.buildEligibilityPlans(audience));
      case "recommendation_available":
      case "program_matched":
        return sortedAudiences.flatMap((audience) => this.buildMatchingPlans(eventName, audience));
      case "program_published":
        return sortedAudiences.flatMap((audience) => this.buildProgramPublishedPlans(audience));
      case "staff_invited":
      case "staff_invitation_accepted":
      case "staff_role_changed":
      case "staff_removed":
        return sortedAudiences.flatMap((audience) => this.buildStaffEventPlans(eventName, audience));
      case "user_registration":
        return sortedAudiences.flatMap((audience) => this.buildUserRegistrationPlans(audience));
      case "user_login":
        return sortedAudiences.flatMap((audience) => this.buildUserLoginPlans(audience));
      case "message_created":
        return sortedAudiences.flatMap((audience) => this.buildMessagePlans(audience));
      case "admin_action":
        return sortedAudiences.flatMap((audience) => this.buildAdminActionPlans(audience));
      default:
        return [];
    }
  }

  private buildApplicationSubmittedPlans(audience: Audience): CommunicationPlan[] {
    switch (audience.role) {
      case "applicant":
        return [this.createPlan("application_submitted", audience, "email", 100)];
      case "organization_admin":
        return [this.createPlan("application_submitted", audience, "telegram", 90)];
      case "reviewer":
        return [this.createPlan("application_submitted", audience, "internal", 80)];
      case "case_worker":
        return [this.createPlan("application_submitted", audience, "internal", 70)];
      case "support":
        return [this.createPlan("application_submitted", audience, "email", 60)];
      default:
        return [];
    }
  }

  private buildApplicationEventPlans(eventName: string, audience: Audience): CommunicationPlan[] {
    // application_approved, application_rejected, application_conditional, etc.
    switch (audience.role) {
      case "applicant":
        return [this.createPlan(eventName, audience, "email", 100)];
      case "organization_admin":
        return [this.createPlan(eventName, audience, "telegram", 90)];
      case "reviewer":
        return [this.createPlan(eventName, audience, "internal", 80)];
      default:
        return [];
    }
  }

  private buildDocumentEventPlans(eventName: string, audience: Audience): CommunicationPlan[] {
    // documents_requested, document_approved, document_rejected, etc.
    switch (audience.role) {
      case "applicant":
        return [this.createPlan(eventName, audience, "email", 100)];
      case "reviewer":
        return [this.createPlan(eventName, audience, "internal", 80)];
      default:
        return [];
    }
  }

  private buildEligibilityPlans(audience: Audience): CommunicationPlan[] {
    switch (audience.role) {
      case "applicant":
        return [this.createPlan("eligibility_assessment_completed", audience, "email", 100)];
      case "organization_admin":
        return [this.createPlan("eligibility_assessment_completed", audience, "internal", 90)];
      default:
        return [];
    }
  }

  private buildMatchingPlans(eventName: string, audience: Audience): CommunicationPlan[] {
    // recommendation_available, program_matched
    switch (audience.role) {
      case "applicant":
        return [this.createPlan(eventName, audience, "email", 100)];
      case "organization_admin":
        return [this.createPlan(eventName, audience, "internal", 90)];
      default:
        return [];
    }
  }

  private buildProgramPublishedPlans(audience: Audience): CommunicationPlan[] {
    switch (audience.role) {
      case "organization_admin":
        return [this.createPlan("program_published", audience, "telegram", 90)];
      default:
        return [];
    }
  }

  private buildStaffEventPlans(eventName: string, audience: Audience): CommunicationPlan[] {
    // staff_invited, staff_invitation_accepted, staff_role_changed, staff_removed
    // NOTE: These will not be called because RuntimeOrchestrator filters out staff_member/staff_admin roles
    // during adaptation from C.1 recipients to legacy Audience format
    // This code is here for architectural completeness but won't execute with current setup
    const role = audience.role as string;
    
    switch (eventName) {
      case "staff_invited":
        if (role === "applicant") {  // Placeholder for now
          return [this.createPlan(eventName, audience, "email", 100)];
        }
        return [];
      case "staff_invitation_accepted":
        if (role === "organization_admin") {
          return [this.createPlan(eventName, audience, "email", 100)];
        }
        return [];
      case "staff_role_changed":
      case "staff_removed":
        if (role === "organization_admin") {
          return [this.createPlan(eventName, audience, "telegram", 90)];
        }
        return [];
      default:
        return [];
    }
  }

  private buildAdminActionPlans(audience: Audience): CommunicationPlan[] {
    switch (audience.role) {
      case "applicant":
        return [this.createPlan("admin_action", audience, "email", 100)];
      case "organization_admin":
        return [this.createPlan("admin_action", audience, "telegram", 90)];
      case "reviewer":
        return [this.createPlan("admin_action", audience, "internal", 80)];
      case "case_worker":
        return [this.createPlan("admin_action", audience, "internal", 70)];
      default:
        return [];
    }
  }

  private buildUserRegistrationPlans(audience: Audience): CommunicationPlan[] {
    switch (audience.role) {
      case "applicant":
        return [this.createPlan("user_registration", audience, "email", 100)];
      case "organization_admin":
        return [this.createPlan("user_registration", audience, "telegram", 90)];
      default:
        return [];
    }
  }

  private buildUserLoginPlans(audience: Audience): CommunicationPlan[] {
    switch (audience.role) {
      case "applicant":
        return [this.createPlan("user_login", audience, "email", 100)];
      case "organization_admin":
        return [this.createPlan("user_login", audience, "telegram", 90)];
      default:
        return [];
    }
  }

  private buildMessagePlans(audience: Audience): CommunicationPlan[] {
    switch (audience.role) {
      case "applicant":
        return [this.createPlan("message_created", audience, "email", 100)];
      case "organization_admin":
        return [this.createPlan("message_created", audience, "internal", 90)];
      default:
        return [];
    }
  }

  private createPlan(event: string, audience: Audience, preferredChannel: CommunicationPlan["preferredChannel"], priority: number): CommunicationPlan {
    const recipientId = this.resolveRecipientId(audience);

    return {
      event,
      audienceRole: audience.role,
      recipientId,
      preferredChannel,
      priority,
      metadata: { audienceName: audience.name }
    };
  }

  private resolveRecipientId(audience: Audience): string | undefined {
    if (audience.recipient.type === "user") {
      return audience.recipient.userId;
    }

    return undefined;
  }

  private deduplicatePlans(plans: CommunicationPlan[]): CommunicationPlan[] {
    const seen = new Set<string>();
    // CRITICAL FIX: Deduplicate by event:role:channel (not by recipientId)
    // This prevents multiple recipients with the same audience role from creating duplicate dispatches
    // Example: Two org_admin recipients should create ONE telegram dispatch, not two
    return plans.filter((plan) => {
      const key = `${plan.event}:${plan.audienceRole}:${plan.preferredChannel}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
