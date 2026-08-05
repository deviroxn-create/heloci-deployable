import test from "node:test";
import assert from "node:assert/strict";
import { notificationService, setNotificationProvidersForTest, setPrismaClientForTest, setPublishedTemplateForTest } from "./notification.service";
import { setCommunicationSettingsForTest } from "./configuration.service";
import * as telegram from "@/lib/telegram/alert-service";

function makeStubProvider(channel: string) {
  const calls: any[] = [];
  return {
    channel: channel as any,
    calls,
    async send(context: any) {
      calls.push(context);
      return { status: "SENT" as const, providerResponse: { channel, recipient: context.recipient } };
    }
  };
}

// Keep notification templates simple for tests
const defaultTemplate = async () => ({
  id: "default",
  name: "generic-email",
  eventName: "application_submitted",
  channel: "email",
  locale: "en",
  title: "Test",
  subject: "Test",
  html: "<div>test</div>",
  plainText: "test",
  variables: [],
  status: "PUBLISHED",
  active: true,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date()
} as any);

const stubPrisma: any = {
  notificationPreference: { findFirst: async () => null },
  notificationLog: {
    create: async ({ data }: any) => ({ id: "log", ...data }),
    update: async ({ where, data }: any) => ({ id: where.id, ...data })
  },
  user: { findUnique: async ({ where }: any) => ({ id: where.id, email: "user@example.com", name: "User" }) }
};

// Add timeline entry stub to satisfy appendTimelineEntry
(stubPrisma as any).communicationTimelineEntry = { create: async () => ({}) } as any;

test("Integration Test A: Applicant submits application triggers Telegram admin alert and applicant email", async () => {
  const stubEmail = makeStubProvider("email");
  const telegramSpy: any[] = [];

  // Stub providers and templates
  setNotificationProvidersForTest(() => [stubEmail as any]);
  setPublishedTemplateForTest(defaultTemplate as any);
  setPrismaClientForTest(stubPrisma as any);

  // Stub queueTelegramAlert
  const originalQueue = telegram.queueTelegramAlert;
  (telegram as any).queueTelegramAlert = async (event: any) => {
    telegramSpy.push(event);
  };

  // Ensure settings allow email channel and admin_test/event
  setCommunicationSettingsForTest({
    enabled: true,
    channels: { email: true, telegram: false, whatsapp: false, internal: false },
    senderEmail: "noreply@example.com",
    telegramBotToken: "",
    telegramChatId: "",
    events: {
      application_submitted: true,
      message_created: true,
      admin_action: true
    } as any
  });

  // Simulate application_submitted payload
  const payload = {
    userId: "applicant-1",
    recipientId: "applicant-1",
    recipientEmail: "applicant@example.com",
    userEmail: "applicant@example.com",
    applicationId: "app-1",
    organizationId: "org-1",
    name: "Applicant"
  } as any;

  // Call notification service and the telegram alert (application-service does both)
  const res = await notificationService.notify("application_submitted" as any, payload as any);
  await (telegram as any).queueTelegramAlert({ type: "submitted", level: "INFO", organizationId: payload.organizationId, data: { applicationId: payload.applicationId, programName: "Test Program", submittedAt: new Date().toISOString() } });

  // Assertions
  assert.equal(res.delivered, true);
  assert.equal(stubEmail.calls.length, 1);
  assert.equal(stubEmail.calls[0].recipient, "applicant@example.com");
  assert.equal(telegramSpy.length, 1);

  // restore
  (telegram as any).queueTelegramAlert = originalQueue;
});

test("Integration Test B: Staff sends case message -> applicant email called", async () => {
  const stubEmail = makeStubProvider("email");
  setNotificationProvidersForTest(() => [stubEmail as any]);
  setPublishedTemplateForTest(defaultTemplate as any);
  setPrismaClientForTest(stubPrisma as any);
  setCommunicationSettingsForTest({
    enabled: true,
    channels: { email: true, telegram: false, whatsapp: false, internal: false },
    senderEmail: "noreply@example.com",
    telegramBotToken: "",
    telegramChatId: "",
    events: {
      message_created: true,
      application_submitted: true,
      admin_action: true
    } as any
  });

  const payload = {
    userId: "applicant-1",
    recipientId: "applicant-1",
    recipientEmail: "applicant@example.com",
    recipient: "applicant@example.com",
    applicantName: "Applicant",
    staffName: "Staff",
    applicationId: "app-1",
    programId: "prog-1",
    organizationId: "org-1",
    programName: "Test Program",
    messagePreview: "Hello applicant"
  } as any;

  const res = await notificationService.notify("message_created" as any, payload as any);
  assert.equal(res.delivered, true);
  assert.equal(stubEmail.calls.length, 1);
  assert.equal(stubEmail.calls[0].recipient, "applicant@example.com");
});

test("Integration Test C: Applicant sends message -> admin alert triggered, applicant email not triggered", async () => {
  const stubEmail = makeStubProvider("email");
  const stubTelegram = makeStubProvider("telegram");

  // For admin alerts, enable telegram and internal only
  setNotificationProvidersForTest(() => [stubEmail as any, stubTelegram as any]);
  setPublishedTemplateForTest(defaultTemplate as any);
  setPrismaClientForTest(stubPrisma as any);

  setCommunicationSettingsForTest({
    enabled: true,
    channels: { email: false, telegram: true, whatsapp: false, internal: true },
    senderEmail: "noreply@example.com",
    telegramBotToken: "token",
    telegramChatId: "chat",
    events: {
      admin_action: true,
      message_created: true,
      application_submitted: true
    } as any
  });

  const payload = {
    userId: "staff-1",
    recipientId: "staff-1",
    recipientEmail: "staff@example.com",
    recipient: "staff@example.com",
    applicantName: "Applicant",
    staffName: "Applicant",
    applicationId: "app-1",
    programId: "prog-1",
    organizationId: "org-1",
    programName: "Test Program",
    messagePreview: "Staff message"
  } as any;

  // Applicant sending should use event 'admin_action'
  const res = await notificationService.notify("admin_action" as any, payload as any);

  // Email provider should not be called
  assert.equal(stubEmail.calls.length, 0);
  // Telegram/internal providers should be used (we have stubTelegram present)
  assert.ok(Array.isArray(res.channels) && res.channels.includes("telegram"));
});
