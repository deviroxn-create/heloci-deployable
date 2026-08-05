import "../notifications/startup.ts";
import { getDomainEventBus } from "./domain-event-bus.ts";
import { createDomainEvent, type DomainEventPayload } from "./domain-event.ts";

export function publishDomainEvent(
  eventName: string,
  payload: DomainEventPayload,
  options?: {
    aggregateId?: string;
    metadata?: Record<string, unknown>;
    correlationId?: string;
    occurredAt?: string;
  }
): void {
  const bus = getDomainEventBus();

  // PART 2 — NOTIFICATION: Step 1 - Event Published
  console.log("\n========== PART 2: NOTIFICATION TRACE ==========");
  console.log("Step 1: Event Published");
  console.log(`  Event Name: ${eventName}`);
  console.log(`  Payload Keys: ${Object.keys(payload || {}).join(', ')}`);
  console.log(`  User ID: ${(payload as any)?.userId}`);
  console.log(`  Organization ID: ${(payload as any)?.organizationId}`);
  console.log(`  Application ID: ${(payload as any)?.applicationId}`);
  console.log(`  Program ID: ${(payload as any)?.programId}`);
  console.log(`  Correlation ID: ${options?.correlationId || 'none'}`);

  // TRACE: log every publish so we can verify real runtime handoffs during registration
  try {
    if (process.env.NODE_ENV !== "production") {
      // Avoid noisy logs in production; keep them for local/runtime-audit only
      console.debug(`[DomainEventPublisher] publish event=${eventName} payloadKeys=${Object.keys(payload || {}).join(",")} busId=${bus.instanceId}`);
    }
  } catch (e) {
    // ignore logging errors
  }

  bus.publish(createDomainEvent(eventName, payload, options));
}
