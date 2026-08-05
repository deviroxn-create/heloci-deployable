import test from "node:test";
import assert from "node:assert/strict";

import { prisma } from "../lib/prisma/client";
import { registerUserAccount } from "../lib/auth/user-profile.service";

function createPrismaError(code: string): Error & { code: string } {
  const error = new Error(`Prisma error ${code}`) as Error & { code: string };
  error.code = code;
  return error;
}

test("registerUserAccount publishes user.registration for new users", async () => {
  const originalCreate = prisma.user.create;
  const originalUpdate = prisma.user.update;
  const originalPublish = (await import("../lib/events/domain-event-publisher")).publishDomainEvent;

  const published: Array<{ eventName: string; payload: Record<string, unknown> }> = [];
  const publisher = await import("../lib/events/domain-event-publisher");

  (publisher as any).publishDomainEvent = (eventName: string, payload: Record<string, unknown>) => {
    published.push({ eventName, payload });
  };
  (prisma.user as any).create = async () => ({
    id: "user-1",
    email: "new-user@example.com",
    name: "New User",
    role: "APPLICANT"
  });
  (prisma.user as any).update = async () => {
    throw new Error("update should not be called for new user creation");
  };

  try {
    await registerUserAccount({ email: "new-user@example.com", name: "New User" });
    assert.equal(published.length, 1);
    assert.equal(published[0].eventName, "user.registration");
    assert.equal(published[0].payload.email, "new-user@example.com");
    assert.equal(published[0].payload.name, "New User");
  } finally {
    (prisma.user as any).create = originalCreate;
    (prisma.user as any).update = originalUpdate;
    (publisher as any).publishDomainEvent = originalPublish;
  }
});

test("registerUserAccount does not publish user.registration when existing email is updated", async () => {
  const originalCreate = prisma.user.create;
  const originalUpdate = prisma.user.update;
  const originalPublish = (await import("../lib/events/domain-event-publisher")).publishDomainEvent;

  const published: Array<{ eventName: string; payload: Record<string, unknown> }> = [];
  const publisher = await import("../lib/events/domain-event-publisher");

  (publisher as any).publishDomainEvent = (eventName: string, payload: Record<string, unknown>) => {
    published.push({ eventName, payload });
  };
  (prisma.user as any).create = async () => {
    throw createPrismaError("P2002");
  };
  (prisma.user as any).update = async () => ({
    id: "user-2",
    email: "existing-user@example.com",
    name: "Existing User",
    role: "APPLICANT"
  });

  try {
    await registerUserAccount({ email: "existing-user@example.com", name: "Existing User" });
    assert.equal(published.length, 0);
  } finally {
    (prisma.user as any).create = originalCreate;
    (prisma.user as any).update = originalUpdate;
    (publisher as any).publishDomainEvent = originalPublish;
  }
});
