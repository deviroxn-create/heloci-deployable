import { AudienceResolver as C1AudienceResolver } from "@/lib/communications/runtime";
import type { CommunicationRequest, AudienceResolvedRequest, CommunicationEvent, Recipient } from "@/lib/communications/contracts";
import { CommunicationPlanner } from "./communication-planner";
import { TemplateResolver } from "./template-resolver";
import { Dispatcher } from "./dispatcher";
import type { AudienceResolutionContext } from "./audience-resolver";
import type { Audience, AudienceRole } from "./audience.types";
import type { CommunicationPlan } from "./communication-plan.types";
import type { DispatchRequest } from "./dispatch.types";
import type { TemplateResolution, UnresolvedTemplateResolution } from "./template-resolution.types";

export interface RuntimeTrace {
  eventName: string;
  audiences: Audience[];
  plans: CommunicationPlan[];
  resolutions: Array<TemplateResolution | UnresolvedTemplateResolution>;
  dispatchRequests: DispatchRequest[];
}

export class RuntimeOrchestrator {
  static async run(eventName: string, context?: AudienceResolutionContext | null): Promise<DispatchRequest[]> {
    return (await this.runWithTrace(eventName, context)).dispatchRequests;
  }

  static async runWithTrace(eventName: string, context?: AudienceResolutionContext | null): Promise<RuntimeTrace> {
    // Generate trace ID for this execution
    const traceId = this.generateTraceId();

    try {
      // Build C.1 CommunicationRequest (stage 1: initial)
      // CRITICAL: organizationId MUST be provided in context
      // EXCEPTION: user.registration and similar "user-only" events may not have organizationId
      if (!context?.organizationId && !this.isUserOnlyEvent(eventName)) {
        console.error(`[RuntimeOrchestrator] AUTHORIZATION VIOLATION: organizationId missing in context for event ${eventName}`);
        return {
          eventName,
          audiences: [],
          plans: [],
          resolutions: [],
          dispatchRequests: [],
        };
      }

      const request: CommunicationRequest = {
        context: {
          traceId,
          organizationId: context?.organizationId || "", // Allow empty for user-only events
          userId: context?.userId,
          createdAt: new Date(),
        },
        event: eventName as CommunicationEvent,
        eventPayload: Object.freeze(context || {}),
        __stage: "initial",
      };

      // Use C.1 AudienceResolver to resolve recipients (stage 2: audience_resolved)
      let audienceResolved: AudienceResolvedRequest;
      try {
        audienceResolved = await C1AudienceResolver.resolve(request);
      } catch (error) {
        console.error(`[RuntimeOrchestrator] C.1 Audience resolution failed for ${eventName}:`, error);
        return {
          eventName,
          audiences: [],
          plans: [],
          resolutions: [],
          dispatchRequests: [],
        };
      }

      // Adapt C.1 recipients to legacy Audience format for downstream compatibility (temporary)
      const audiences = this.adaptRecipientsToAudiences(audienceResolved.recipients);

      // Continue with planning and dispatch
      const communicationPlanner = new CommunicationPlanner();
      const templateResolver = new TemplateResolver();
      const dispatcher = new Dispatcher();

      const plans = communicationPlanner.plan(eventName, audiences);
      const resolutions = plans
        .map((plan) => templateResolver.resolve(plan));

      const dispatchRequests = resolutions
        .filter((resolution): resolution is TemplateResolution => Boolean(resolution.templateKey))
        .map((resolution) => dispatcher.dispatch(resolution))
        .filter((request): request is DispatchRequest => Boolean(request));

      // Single consolidated runtime trace output (guarded by env flag)
      try {
        if (process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          const audiencesText = audiences.map((a) => a.name).join("\n");
          const plansText = plans.map((p) => `${p.audienceRole}: ${p.preferredChannel}`).join("\n");
          const templatesText = resolutions
            .filter((r): r is TemplateResolution => Boolean((r as TemplateResolution).templateKey))
            .map((r) => `${r.audienceRole}.${r.event}.${r.channel} -> ${r.templateKey}`)
            .join("\n");
          const dispatchText = dispatchRequests.map((d) => `${d.audienceRole}: ${d.channel}`).join("\n");

          console.log("========== Notification Runtime (C.1 Integrated) ==========");
          console.log("EVENT:");
          console.log(eventName);
          console.log("");
          console.log("Audiences:");
          console.log(audiencesText || "<none>");
          console.log("");
          console.log("Plans:");
          console.log(plansText || "<none>");
          console.log("");
          console.log("Templates:");
          console.log(templatesText || "<none>");
          console.log("");
          console.log("Dispatch:");
          console.log(dispatchText || "<none>");
          console.log("========================================================");
        }
      } catch (e) {
        // swallow tracing errors
      }

      return {
        eventName,
        audiences,
        plans,
        resolutions,
        dispatchRequests,
      };
    } catch (error) {
      console.error(`[RuntimeOrchestrator] Fatal error in runWithTrace for ${eventName}:`, error);
      return {
        eventName,
        audiences: [],
        plans: [],
        resolutions: [],
        dispatchRequests: [],
      };
    }
  }

  /**
   * Check if this event type doesn't require organizationId
   * (e.g., user registration where user has no org yet)
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
   * Adapt C.1 Recipient[] to legacy Audience[] format
   * This is a temporary adapter for backward compatibility during migration
   * Maps C.1 AudienceRole to legacy AudienceRole (org_admin -> organization_admin, etc.)
   * TODO: Remove when all downstream layers migrated to Recipient type
   */
  private static adaptRecipientsToAudiences(recipients: readonly Recipient[]): Audience[] {
    return recipients.map((r) => {
      // Map C.1 roles to legacy roles
      let legacyRole: AudienceRole = r.role as any;
      if (r.role === "org_admin") {
        legacyRole = "organization_admin";
      }
      // staff_member and staff_admin don't exist in legacy, so skip them
      if (r.role === "staff_member" || r.role === "staff_admin") {
        return null as any;
      }

      return {
        role: legacyRole,
        name: r.name || r.email,
        recipient: {
          type: "user" as const,
          userId: r.id,
          email: r.email,
        },
      };
    }).filter((a) => a !== null);
  }

  /**
   * Generate a unique trace ID for this execution
   */
  private static generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
