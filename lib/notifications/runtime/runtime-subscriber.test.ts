import test from "node:test";
import assert from "node:assert/strict";

import { createDomainEvent, type DomainEvent } from "../../events/domain-event.ts";
import { DomainEventBus } from "../../events/domain-event-bus.ts";
import { RuntimeOrchestrator } from "./runtime-orchestrator.ts";
import { RuntimeSubscriber } from "./runtime-subscriber.ts";
import type { DispatchRequest } from "./dispatch.types.ts";

function createApplicationSubmittedEvent() {
  return createDomainEvent(
    "application.submitted",
    {
      applicationId: "app-123",
      applicantId: "user-1",
      userEmail: "applicant@example.com"
    },
    {
      aggregateId: "app-123",
      metadata: {
        source: "application-service"
      },
      correlationId: "corr-123"
    }
  );
}

test("subscriber registers successfully", () => {
  const bus = new DomainEventBus();
  const subscriber = new RuntimeSubscriber(bus);

  const registrations = subscriber.register();

  assert.equal(registrations.length, 10);
  assert.equal(registrations[0].eventName, "user.registration");

  subscriber.unregister();
});

test("matching events invoke RuntimeOrchestrator", () => {
  const bus = new DomainEventBus();
  const originalRun = RuntimeOrchestrator.run;
  const invocations: Array<{ eventName: string; payload: Record<string, unknown> }> = [];

  RuntimeOrchestrator.run = function (eventName: string, context?: any) {
    invocations.push({ eventName, payload: context ?? {} });
    return [{ event: eventName, audienceRole: "applicant", channel: "email", recipientId: "recipient-1", templateKey: "applicant.user-registration.email", metadata: { source: "orchestrator" } }];
  } as typeof RuntimeOrchestrator.run;

  try {
    const subscriber = new RuntimeSubscriber(bus);
    subscriber.register();

    bus.publish(createApplicationSubmittedEvent());

    assert.equal(invocations.length, 1);
    assert.equal(invocations[0].eventName, "application_submitted");
    assert.equal(invocations[0].payload.userEmail, "applicant@example.com");
    assert.deepEqual(subscriber.getLastRuntimeOutput(), invocations[0].payload ? [{ event: "application_submitted", audienceRole: "applicant", channel: "email", recipientId: "recipient-1", templateKey: "applicant.user-registration.email", metadata: { source: "orchestrator" } }] : []);
  } finally {
    RuntimeOrchestrator.run = originalRun;
  }
});

test("unknown events are ignored", () => {
  const bus = new DomainEventBus();
  const originalRun = RuntimeOrchestrator.run;
  let invocationCount = 0;

  RuntimeOrchestrator.run = function () {
    invocationCount += 1;
    return [];
  } as typeof RuntimeOrchestrator.run;

  try {
    const subscriber = new RuntimeSubscriber(bus);
    subscriber.register();

    bus.publish(createDomainEvent("application.archived", { applicationId: "app-123" }));

    assert.equal(invocationCount, 0);
    assert.deepEqual(subscriber.getLastRuntimeOutput(), []);
    assert.equal(subscriber.getLastInvocation().eventName, null);
  } finally {
    RuntimeOrchestrator.run = originalRun;
  }
});

test("multiple published events invoke the runtime in order", () => {
  const bus = new DomainEventBus();
  const originalRun = RuntimeOrchestrator.run;
  const order: string[] = [];

  RuntimeOrchestrator.run = function (eventName: string) {
    order.push(eventName);
    return [];
  } as typeof RuntimeOrchestrator.run;

  try {
    const subscriber = new RuntimeSubscriber(bus);
    subscriber.register();

    bus.publish(createDomainEvent("user.login", { userId: "user-1" }));
    bus.publish(createDomainEvent("application.submitted", { applicationId: "app-123" }));

    assert.deepEqual(order, ["user_login", "application_submitted"]);
  } finally {
    RuntimeOrchestrator.run = originalRun;
  }
});

test("event payload reaches the orchestrator unchanged", () => {
  const bus = new DomainEventBus();
  const originalRun = RuntimeOrchestrator.run;
  let receivedPayload: Record<string, unknown> | undefined;

  RuntimeOrchestrator.run = function (_eventName: string, context?: any) {
    receivedPayload = context;
    return [];
  } as typeof RuntimeOrchestrator.run;

  try {
    const subscriber = new RuntimeSubscriber(bus);
    subscriber.register();
    const event = createApplicationSubmittedEvent();

    bus.publish(event);

    assert.deepEqual(receivedPayload, event.payload);
  } finally {
    RuntimeOrchestrator.run = originalRun;
  }
});

test("subscriber has no side effects beyond invoking the runtime", () => {
  const bus = new DomainEventBus();
  const originalRun = RuntimeOrchestrator.run;
  let invocationCount = 0;

  RuntimeOrchestrator.run = function (eventName: string, context?: any) {
    invocationCount += 1;
    return [{ event: eventName, audienceRole: "applicant", channel: "email", recipientId: "recipient-1", templateKey: "applicant.user-registration.email", metadata: { source: "orchestrator" } }];
  } as typeof RuntimeOrchestrator.run;

  try {
    const subscriber = new RuntimeSubscriber(bus);
    const registrations = subscriber.register();

    bus.publish(createApplicationSubmittedEvent());

    assert.equal(invocationCount, 1);
    assert.equal(registrations.length, 10);
    assert.equal(subscriber.getLastInvocation().eventName, "application_submitted");
  } finally {
    RuntimeOrchestrator.run = originalRun;
  }
});
