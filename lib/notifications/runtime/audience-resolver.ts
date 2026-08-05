import { prisma } from "@/lib/prisma/client";
import type { Audience, AudienceRecipient, AudienceRole } from "./audience.types";

export type ResolverEventName =
  | "user_registration"
  | "user_login"
  | "application_submitted"
  | "application_reviewed"
  | "application_approved"
  | "application_rejected"
  | "application_waitlisted"
  | "documents_requested"
  | "message_created"
  | "admin_action";

export interface AudienceResolutionContext {
  userId?: string;
  userEmail?: string;
  recipientId?: string;
  recipientEmail?: string;
  organizationId?: string;
  organizationAdminId?: string;
  organizationAdminEmail?: string;
  reviewerId?: string;
  reviewerEmail?: string;
  caseWorkerId?: string;
  caseWorkerEmail?: string;
  supportEmail?: string;
  [key: string]: unknown;
}

export class AudienceResolver {
  async resolve(eventName: string, context?: AudienceResolutionContext | null): Promise<Audience[]> {
    if (!context || typeof context !== "object") {
      return [];
    }

    // PART 2 — Step 5: Audience Resolution
    console.log("\nStep 5: Audience Resolution");
    console.log(`  Event: ${eventName}`);
    console.log(`  Context:`);
    console.log(`    userId: ${context.userId}`);
    console.log(`    userEmail: ${context.userEmail}`);
    console.log(`    organizationId: ${context.organizationId}`);
    console.log(`    organizationAdminId: ${context.organizationAdminId}`);
    console.log(`    reviewerId: ${context.reviewerId}`);
    console.log(`    caseWorkerId: ${context.caseWorkerId}`);
    console.log(`    supportEmail: ${context.supportEmail}`);

    const normalizedEvent = eventName as ResolverEventName;
    const audiences = await this.buildAudiences(normalizedEvent, context);
    const result = this.deduplicateAudiences(audiences);
    
    console.log(`  Resolved Audiences: ${result.length}`);
    result.forEach((aud, idx) => {
      console.log(`    [${idx}] Role: ${aud.role}`);
      console.log(`        Recipient Type: ${aud.recipient.type}`);
      if (aud.recipient.type === 'user') {
        console.log(`        User ID: ${aud.recipient.userId}`);
        console.log(`        Email: ${aud.recipient.email}`);
      } else if (aud.recipient.type === 'email') {
        console.log(`        Email: ${aud.recipient.email}`);
      }
    });

    return result;
  }

  private async buildAudiences(eventName: ResolverEventName, context: AudienceResolutionContext): Promise<Audience[]> {
    switch (eventName) {
      case "user_registration":
      case "user_login":
        return [
          this.resolveApplicant(context),
          await this.resolveOrganizationAdmin(context)
        ].filter((audience): audience is Audience => Boolean(audience));
      case "application_submitted":
        return [
          this.resolveApplicant(context),
          await this.resolveOrganizationAdmin(context),
          this.resolveReviewer(context),
          this.resolveCaseWorker(context),
          this.resolveSupport(context)
        ].filter((audience): audience is Audience => Boolean(audience));
      case "application_reviewed":
      case "application_approved":
      case "application_rejected":
      case "application_waitlisted":
      case "documents_requested":
        return [this.resolveApplicant(context), this.resolveReviewer(context)].filter((audience): audience is Audience => Boolean(audience));
      case "message_created":
      case "admin_action":
        return [this.resolveApplicant(context), await this.resolveOrganizationAdmin(context)].filter((audience): audience is Audience => Boolean(audience));
      default:
        return [];
    }
  }

  private resolveApplicant(context: AudienceResolutionContext): Audience | null {
    const recipient = this.buildRecipient(context.userId, context.userEmail, context.recipientId, context.recipientEmail);
    
    // STEP 3: Instrument recipient resolution
    console.log("🎯 [AudienceResolver] Resolving applicant for application.submitted:", {
      context: {
        userId: context.userId,
        userEmail: context.userEmail,
        recipientId: context.recipientId,
        recipientEmail: context.recipientEmail
      },
      resolved: {
        recipientType: recipient?.type,
        recipientUserId: recipient?.userId,
        recipientEmail: recipient?.email
      }
    });
    
    if (!recipient) {
      return null;
    }

    return {
      role: "applicant",
      name: "Applicant",
      recipient
    };
  }

  private async resolveOrganizationAdmin(context: AudienceResolutionContext): Promise<Audience | null> {
    const explicitRecipient = this.buildRecipient(context.organizationAdminId, context.organizationAdminEmail);
    if (explicitRecipient) {
      return {
        role: "organization_admin",
        name: "Organization Admin",
        recipient: explicitRecipient
      };
    }

    const recipient = await this.resolveOrganizationAdminRecipient(context);
    if (!recipient) {
      return null;
    }

    return {
      role: "organization_admin",
      name: "Organization Admin",
      recipient
    };
  }

  private async resolveOrganizationAdminRecipient(context: AudienceResolutionContext): Promise<AudienceRecipient | null> {
    const organizationId = await this.resolveOrganizationId(context);
    if (!organizationId) {
      return null;
    }

    const adminMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        role: "org_admin"
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    if (!adminMember?.user) {
      return null;
    }

    return this.buildRecipient(adminMember.user.id, adminMember.user.email);
  }

  private async resolveOrganizationId(context: AudienceResolutionContext): Promise<string | undefined> {
    if (context.organizationId) {
      return context.organizationId as string;
    }

    if (context.userId) {
      const user = await prisma.user.findUnique({
        where: { id: context.userId },
        select: { organizationId: true }
      });

      if (user?.organizationId) {
        return user.organizationId;
      }
    }

    return undefined;
  }

  private resolveReviewer(context: AudienceResolutionContext): Audience | null {
    const recipient = this.buildRecipient(context.reviewerId, context.reviewerEmail);
    if (!recipient) {
      return null;
    }

    return {
      role: "reviewer",
      name: "Reviewer",
      recipient
    };
  }

  private resolveCaseWorker(context: AudienceResolutionContext): Audience | null {
    const recipient = this.buildRecipient(context.caseWorkerId, context.caseWorkerEmail);
    if (!recipient) {
      return null;
    }

    return {
      role: "case_worker",
      name: "Case Worker",
      recipient
    };
  }

  private resolveSupport(context: AudienceResolutionContext): Audience | null {
    const email = context.supportEmail as string | undefined;
    if (!email) {
      return null;
    }

    return {
      role: "support",
      name: "Support",
      recipient: { type: "email", email }
    };
  }

  private buildRecipient(userId?: string, email?: string, recipientId?: string, recipientEmail?: string): AudienceRecipient | null {
    const effectiveUserId = userId || recipientId;
    const effectiveEmail = email || recipientEmail;

    if (effectiveUserId && effectiveEmail) {
      return { type: "user", userId: effectiveUserId, email: effectiveEmail };
    }

    if (effectiveUserId) {
      return { type: "user", userId: effectiveUserId };
    }

    if (effectiveEmail) {
      return { type: "email", email: effectiveEmail };
    }

    return null;
  }

  private deduplicateAudiences(audiences: Audience[]): Audience[] {
    const seen = new Set<string>();
    return audiences.filter((audience) => {
      const identity = this.getRecipientIdentity(audience.recipient);
      const key = `${audience.role}:${audience.recipient.type}:${identity}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getRecipientIdentity(recipient: AudienceRecipient): string {
    switch (recipient.type) {
      case "user":
        return recipient.userId ?? "";
      case "email":
        return recipient.email ?? "";
      case "system":
        return "system";
    }
  }
}
