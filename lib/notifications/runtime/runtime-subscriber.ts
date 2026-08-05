import { DomainEventBus } from "../../events/domain-event-bus.ts";
import type { DomainEvent } from "../../events/domain-event.ts";
import type { EventSubscription } from "../../events/event-handler.ts";
import { RuntimeOrchestrator } from "./runtime-orchestrator.ts";
import type { DispatchRequest } from "./dispatch.types.ts";
import type { AudienceResolutionContext } from "./audience-resolver.ts";

const DEFAULT_RUNTIME_EVENT_NAMES = [
  "user.registration",
  "user.login",
  "application.submitted",
  "application.reviewed",
  "application.review.completed",
  "application.approved",
  "application.rejected",
  "application.waitlisted",
  "documents.requested",
  "message.created",
  "admin.action"
] as const;

export class RuntimeSubscriber {
  private readonly subscriptions: EventSubscription[] = [];
  private lastHandlerResult: DispatchRequest[] = [];
  private lastContext: AudienceResolutionContext | null = null;
  private lastEventName: string | null = null;

  constructor(
    private readonly bus: DomainEventBus,
    private readonly orchestrator: typeof RuntimeOrchestrator = RuntimeOrchestrator
  ) {}

  register(eventNames: string[] = [...DEFAULT_RUNTIME_EVENT_NAMES]): EventSubscription[] {
    this.subscriptions.length = 0;

    for (const eventName of eventNames) {
      const subscription = this.bus.subscribe(eventName, (event) => this.handleDomainEvent(event));
      this.subscriptions.push(subscription);
    }

    return [...this.subscriptions];
  }

  unregister(): void {
    for (const subscription of this.subscriptions) {
      this.bus.unsubscribe(subscription);
    }

    this.subscriptions.length = 0;
  }

  getLastRuntimeOutput(): DispatchRequest[] {
    return [...this.lastHandlerResult];
  }

  getLastInvocation(): {
    eventName: string | null;
    context: AudienceResolutionContext | null;
  } {
    return {
      eventName: this.lastEventName,
      context: this.lastContext
    };
  }

  private handleDomainEvent(event: DomainEvent): void {
    const normalizedEventName = normalizeRuntimeEventName(event.eventName);
    const runtimeContext = buildAudienceResolutionContext(event.payload);

    this.lastEventName = normalizedEventName;
    this.lastContext = runtimeContext;

    const result = this.orchestrator.run(normalizedEventName, runtimeContext);

    if (isPromise(result)) {
      result
        .then((dispatchRequests) => {
          this.lastHandlerResult = dispatchRequests;
        })
        .catch(() => {
          this.lastHandlerResult = [];
        });
    } else {
      this.lastHandlerResult = (result || []) as DispatchRequest[];
    }
  }
}

function normalizeRuntimeEventName(eventName: string): string {
  if (eventName === "application.review.completed") {
    return "application_reviewed";
  }
  return eventName.replace(/\./g, "_");
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return value !== null && typeof (value as any).then === "function";
}

function buildAudienceResolutionContext(payload: Record<string, unknown>): AudienceResolutionContext {
  return payload as AudienceResolutionContext;
}

