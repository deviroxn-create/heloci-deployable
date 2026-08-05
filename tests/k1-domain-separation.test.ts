import test from "node:test";
import assert from "node:assert/strict";
import { registerUserAccount } from "../lib/auth/user-profile.service";
import { prisma } from "../lib/prisma/client";
import { getDomainEventBus } from "../lib/events/domain-event-bus";
import { createDomainEvent } from "../lib/events/domain-event";

test("registerUserAccount publishes a business event instead of notifying directly", async () => {
  const bus = getDomainEventBus();
  const received: Array<{ eventName: string; payload: Record<string, unknown> }> = [];

  const originalUpsert = prisma.user.upsert;
  const originalNotify = (await import("../lib/notifications/notification.service")).notificationService.notify;

  const notifySpy = async () => {
    throw new Error("business service should not call notification service");
  };

  const subscription = bus.subscribe("user.registration", (event) => {
    received.push({ eventName: event.eventName, payload: event.payload as Record<string, unknown> });
  });

  try {
    (prisma.user as any).upsert = async () => ({
      id: "user-123",
      email: "applicant@example.com",
      name: "Applicant Name",
      role: "APPLICANT",
      organizationId: null,
    });

    (await import("../lib/notifications/notification.service")).notificationService.notify = notifySpy as any;

    await registerUserAccount({ email: "applicant@example.com", name: "Applicant Name" });

    assert.equal(received.length, 1);
    assert.equal(received[0].eventName, "user.registration");
    assert.equal(received[0].payload.userId, "user-123");
    assert.equal(received[0].payload.email, "applicant@example.com");
  } finally {
    bus.unsubscribe(subscription);
    (prisma.user as any).upsert = originalUpsert;
    (await import("../lib/notifications/notification.service")).notificationService.notify = originalNotify as any;
  }
});
