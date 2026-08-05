import test from "node:test";
import assert from "node:assert/strict";

import { DomainEventBus } from "../lib/events/domain-event-bus";
import { createDomainEvent } from "../lib/events/domain-event";
import { RuntimeSubscriber } from "../lib/notifications/runtime/runtime-subscriber";
import { RuntimeOrchestrator } from "../lib/notifications/runtime/runtime-orchestrator";

test("RuntimeSubscriber normalizes application.review.completed to application_reviewed", async () => {
  const bus = new DomainEventBus();
  const originalRun = RuntimeOrchestrator.run;
  const invocations: Array<{ eventName: string; payload: Record<string, unknown> }> = [];

  RuntimeOrchestrator.run = function (eventName: string, context?: any) {
    invocations.push({ eventName, payload: context ?? {} });
    return [];
  } as typeof RuntimeOrchestrator.run;

  try {
    const subscriber = new RuntimeSubscriber(bus);
    subscriber.register();

    bus.publish(createDomainEvent("application.review.completed", {
      applicationId: "app-123",
      userId: "user-1",
      reviewerId: "reviewer-1",
      reviewDecision: "approved"
    }));

    assert.equal(invocations.length, 1);
    assert.equal(invocations[0].eventName, "application_reviewed");
    assert.equal(invocations[0].payload.applicationId, "app-123");
    assert.equal(invocations[0].payload.userId, "user-1");
  } finally {
    RuntimeOrchestrator.run = originalRun;
  }
});
