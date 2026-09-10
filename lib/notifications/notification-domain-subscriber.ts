import { getDomainEventBus } from "../events/domain-event-bus.ts";
import type { DomainEvent } from "../events/domain-event.ts";
import type { EventSubscription } from "../events/event-handler.ts";
import { notificationService } from "./notification.service";
import { getCommunicationEventForDomainEvent, getAllDomainEvents } from "../communications/communication-registry.ts";

/**
 * PHASE B: CANONICAL SUBSCRIBER COMPLETION
 * 
 * This subscriber ensures every published domain event has exactly ONE path to notification.
 * It reads from the Communication Intent Catalog (registry) instead of hardcoded mappings.
 * 
 * CONSTRAINT: This is the ONLY bridge between domain events and notification service.
 * All other paths to notificationService are eliminated in Phase D.
 */

// Phase B: Read from registry instead of hardcoding
// This becomes the source of truth for which domain events trigger notifications
const DEFAULT_SUBSCRIBED_EVENTS = getAllDomainEvents() as readonly string[];

export class NotificationDomainSubscriber {
  private readonly subscriptions: EventSubscription[] = [];
  private registered = false;

  constructor(private readonly bus = getDomainEventBus()) {}

  register(eventNames: readonly string[] = DEFAULT_SUBSCRIBED_EVENTS): EventSubscription[] {
    if (this.registered) {
      return [...this.subscriptions];
    }

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[NotificationDomainSubscriber] registering for events=${eventNames.join(",")} busId=${(this.bus as any).instanceId ?? "unknown"}`);
    }

    for (const eventName of eventNames) {
      const subscription = this.bus.subscribe(eventName, (event) => this.handleDomainEvent(event));
      this.subscriptions.push(subscription);
    }

    this.registered = true;

    return [...this.subscriptions];
  }

  unregister(): void {
    for (const subscription of this.subscriptions) {
      this.bus.unsubscribe(subscription);
    }

    this.subscriptions.length = 0;
  }

  private handleDomainEvent(event: DomainEvent): void {
    // PART 2 — Step 2: Domain Subscriber
    console.log("\nStep 2: Domain Subscriber");
    console.log(`  Event Received: ${event.eventName}`);
    console.log(`  Payload Keys: ${Object.keys(event.payload || {}).join(", ")}`);

    // PHASE B: Query registry to get the communication event
    const communicationEventName = getCommunicationEventForDomainEvent(event.eventName);

    // If no mapping exists in registry, log and skip (no silent drops)
    if (!communicationEventName) {
      console.warn(
        `[NotificationDomainSubscriber] UNREGISTERED DOMAIN EVENT: ${event.eventName}. ` +
        `Add to Communication Intent Catalog to enable notifications.`
      );
      return;
    }

    // PART 2 — Step 3: Notification Service Mapping
    console.log("\nStep 3: Event Mapping");
    console.log(`  Domain Event: ${event.eventName}`);
    console.log(`  Communication Event: ${communicationEventName}`);

    try {
      if (process.env.NODE_ENV !== "production") {
        console.debug(
          `[NotificationDomainSubscriber] domain_event=${event.eventName} ` +
          `-> communication_intent=${communicationEventName} ` +
          `payload_keys=${Object.keys(event.payload || {}).join(",")}`
        );
      }
    } catch (e) {
      // ignore logging errors
    }

    // PHASE B: Always use the registry-derived name (no hardcoding)
    void Promise.resolve(notificationService.notify(communicationEventName as any, event.payload as any))
      .then((result) => {
        console.log("\nStep 4: Notification Service Result");
        console.log(`  Delivered: ${result?.delivered}`);
        console.log(`  Channels: ${JSON.stringify(result?.channels)}`);
        if (process.env.NODE_ENV !== "production") {
          console.debug(
            `[NotificationDomainSubscriber] notification_delivered ` +
            `intent=${communicationEventName} ` +
            `delivered=${result?.delivered} ` +
            `channels=${JSON.stringify(result?.channels)} ` +
            `error=${result?.error ?? "none"}`
          );
        }
      })
      .catch((err) => {
        console.error("\nStep 4: Notification Service Error");
        console.error(`  Error: ${err.message}`);
        if (process.env.NODE_ENV !== "production") {
          console.debug(
            `[NotificationDomainSubscriber] notification_delivery_failed ` +
            `intent=${communicationEventName}`,
            err
          );
        }
        // Notification delivery is best-effort; business events should not fail the originating workflow.
      });
  }
}
