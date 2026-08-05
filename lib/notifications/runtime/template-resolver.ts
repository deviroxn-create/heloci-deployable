import type { CommunicationPlan } from "./communication-plan.types";
import type { AudienceRole } from "./audience.types";
import type { TemplateResolution, UnresolvedTemplateResolution } from "./template-resolution.types";

export class TemplateResolver {
  resolve(plan: CommunicationPlan): TemplateResolution | UnresolvedTemplateResolution {
    if (!plan?.event || !plan.audienceRole) {
      return this.createUnresolved(plan);
    }

    const channel = plan.preferredChannel;
    const templateKey = this.resolveTemplateKey(plan.event, plan.audienceRole, channel);

    if (!templateKey) {
      return this.createUnresolved(plan);
    }

    return {
      event: plan.event,
      audienceRole: plan.audienceRole,
      channel,
      templateKey,
      locale: "en",
      version: 1
    };
  }

  private resolveTemplateKey(event: string, audienceRole: AudienceRole, channel: CommunicationPlan["preferredChannel"]): string | null {
    const audiencePrefix = this.getAudiencePrefix(audienceRole);
    if (!audiencePrefix) {
      return null;
    }

    const eventKey = this.getEventKey(event);
    if (!eventKey) {
      return null;
    }

    return `${audiencePrefix}.${eventKey}.${channel}`;
  }

  private getAudiencePrefix(audienceRole: AudienceRole): string | null {
    switch (audienceRole) {
      case "applicant":
        return "applicant";
      case "organization_admin":
        return "admin";
      case "reviewer":
        return "reviewer";
      case "case_worker":
        return "case-worker";
      case "support":
        return "support";
      case "system":
        return "system";
      default:
        return null;
    }
  }

  private getEventKey(event: string): string | null {
    switch (event) {
      case "application_submitted":
        return "application-submitted";
      case "application_approved":
        return "application-approved";
      case "application_rejected":
        return "application-rejected";
      case "application_conditional":
        return "application-conditional";
      case "application_waitlisted":
        return "application-waitlisted";
      case "application_withdrawn":
        return "application-withdrawn";
      case "application_under_review":
        return "application-under-review";
      case "documents_requested":
        return "documents-requested";
      case "document_approved":
        return "document-approved";
      case "document_rejected":
        return "document-rejected";
      case "document_replacement_requested":
        return "document-replacement-requested";
      case "eligibility_assessment_completed":
        return "eligibility-assessment-completed";
      case "recommendation_available":
        return "recommendation-available";
      case "program_matched":
        return "program-matched";
      case "program_published":
        return "program-published";
      case "user_registration":
        return "user-registration";
      case "user_login":
        return "user-login";
      case "message_created":
        return "message-created";
      case "admin_action":
        // CRITICAL FIX: admin_action should map to admin_action template key, not message-created
        return "admin-action";
      default:
        return null;
    }
  }

  private createUnresolved(plan: CommunicationPlan): UnresolvedTemplateResolution {
    return {
      event: plan?.event ?? "",
      audienceRole: plan?.audienceRole ?? "system",
      channel: plan?.preferredChannel ?? "email",
      templateKey: null,
      locale: "en",
      version: 1
    };
  }
}
