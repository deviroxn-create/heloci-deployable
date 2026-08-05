import test from "node:test";
import assert from "node:assert/strict";

import { createDomainEvent, type DomainEvent } from "./domain-event.ts";
import { DomainEventBus } from "./domain-event-bus.ts";

function sampleEvent() {
  return createDomainEvent(
    "application.submitted",
    {
      applicationId: "app-123",
      applicantId: "user-1"
    },
    {
      aggregateId: "app-123",
      metadata: {
        source: "application-service",
        tenantId: "tenant-42"
      },
      correlationId: "corr-99"
    }
  );
}

test("publish delivers events to subscribers", () => {
  const bus = new DomainEventBus();
  const received: DomainEvent[] = [];

  const subscription = bus.subscribe("application.submitted", (event) => {
    received.push(event);
  });

  bus.publish(sampleEvent());

  assert.equal(received.length, 1);
  assert.equal(received[0].eventName, "application.submitted");
  assert.equal(received[0].payload.applicationId, "app-123");
  assert.equal(received[0].metadata?.source, "application-service");
  assert.equal(subscription.eventName, "application.submitted");

  bus.unsubscribe(subscription);
});

test("multiple subscribers receive the same event", () => {
  const bus = new DomainEventBus();
  const receivedA: string[] = [];
  const receivedB: string[] = [];

  bus.subscribe("application.submitted", (event) => {
    receivedA.push(event.eventName);
  });
  bus.subscribe("application.submitted", (event) => {
    receivedB.push(event.eventName);
  });

  bus.publish(sampleEvent());

  assert.deepEqual(receivedA, ["application.submitted"]);
  assert.deepEqual(receivedB, ["application.submitted"]);
});

test("subscribers only receive matching events", () => {
  const bus = new DomainEventBus();
  const received: string[] = [];

  bus.subscribe("application.submitted", () => {
    received.push("application.submitted");
  });
  bus.subscribe("application.approved", () => {
    received.push("application.approved");
  });

  bus.publish(sampleEvent());

  assert.deepEqual(received, ["application.submitted"]);
});

test("unsubscribe works correctly", () => {
  const bus = new DomainEventBus();
  const received: string[] = [];

  const subscription = bus.subscribe("application.submitted", () => {
    received.push("application.submitted");
  });

  bus.publish(sampleEvent());
  bus.unsubscribe(subscription);
  bus.publish(sampleEvent());

  assert.deepEqual(received, ["application.submitted"]);
});

test("events preserve payload and metadata", () => {
  const bus = new DomainEventBus();
  let captured: DomainEvent | undefined;

  bus.subscribe("application.submitted", (event) => {
    captured = event;
  });

  const event = sampleEvent();
  bus.publish(event);

  assert.deepEqual(captured, event);
  assert.equal(captured?.correlationId, "corr-99");
  assert.deepEqual(captured?.metadata, {
    source: "application-service",
    tenantId: "tenant-42"
  });
});

test("publish order is deterministic", () => {
  const bus = new DomainEventBus();
  const order: string[] = [];

  const first = bus.subscribe("application.submitted", () => {
    order.push("first");
  });
  const second = bus.subscribe("application.submitted", () => {
    order.push("second");
  });

  bus.publish(sampleEvent());

  assert.deepEqual(order, ["first", "second"]);

  bus.unsubscribe(first);
  bus.unsubscribe(second);
});

test("publishing with no subscribers succeeds", () => {
  const bus = new DomainEventBus();

  assert.doesNotThrow(() => {
    bus.publish(sampleEvent());
  });
});
