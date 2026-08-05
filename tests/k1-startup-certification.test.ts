import test from "node:test";
import assert from "node:assert/strict";

import { getDomainEventBus } from "../lib/events/domain-event-bus";
import { NotificationDomainSubscriber } from "../lib/notifications/notification-domain-subscriber";

function clearModuleCache(modulePath: string) {
  try {
    const resolved = require.resolve(modulePath);
    delete require.cache[resolved];
  } catch {
    // ignore missing cache entries
  }
}

test("startup initialization runs exactly once and logs startup events", async () => {
  const logs: string[] = [];
  const originalConsoleDebug = console.debug;
  console.debug = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };

  try {
    clearModuleCache("../lib/notifications/startup");
    const startup = await import("../lib/notifications/startup");
    startup.initializeNotificationRuntime();
    startup.initializeNotificationRuntime();

    const startupLogs = logs.filter((line) => line.includes("[Startup]"));
    assert.deepStrictEqual(startupLogs, [
      "[Startup] Notification Runtime Initialized",
      "[Startup] Domain Subscriber Registered",
      "[Startup] Runtime Ready"
    ]);
  } finally {
    console.debug = originalConsoleDebug;
  }
});

test("NotificationDomainSubscriber prevents duplicate registration", () => {
  const bus = getDomainEventBus();
  const subscriber = new NotificationDomainSubscriber(bus);

  const registrationsA = subscriber.register();
  const registrationsB = subscriber.register();

  assert.equal(registrationsA.length, registrationsB.length);
  assert.deepStrictEqual(registrationsA, registrationsB);
});

test("publish() does not perform lazy registration", async () => {
  const originalRegister = NotificationDomainSubscriber.prototype.register;
  let registerCount = 0;
  NotificationDomainSubscriber.prototype.register = function (this: NotificationDomainSubscriber) {
    registerCount += 1;
    return [] as any;
  };

  try {
    const publisher = await import("../lib/events/domain-event-publisher");
    publisher.publishDomainEvent("user.registration", { userId: "user-1", email: "applicant@example.com", name: "Applicant" });
    assert.equal(registerCount, 0);
  } finally {
    NotificationDomainSubscriber.prototype.register = originalRegister;
  }
});

test("runtime survives multiple requests and uses the same event bus instance", async () => {
  const firstBus = getDomainEventBus();
  const secondBus = getDomainEventBus();

  assert.strictEqual(firstBus, secondBus);

  const publisher = await import("../lib/events/domain-event-publisher");
  let eventDelivered = false;
  const subscription = secondBus.subscribe("user.registration", () => {
    eventDelivered = true;
  });

  try {
    publisher.publishDomainEvent("user.registration", { userId: "user-1", email: "applicant@example.com", name: "Applicant" });
    assert.equal(eventDelivered, true);
  } finally {
    secondBus.unsubscribe(subscription);
  }
});
