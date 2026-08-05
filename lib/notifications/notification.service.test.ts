import test from "node:test";
import assert from "node:assert/strict";
import { extractTemplateVariables, renderNotificationTemplate, notificationService, setNotificationProvidersForTest, setPrismaClientForTest, setPublishedTemplateForTest, shouldDeliverChannel } from "./notification.service.ts";
import { setCommunicationSettingsForTest } from "./configuration.service.ts";
import { buildNotificationTemplateWhere } from "./template.service.ts";
import { buildApplicationSubmittedNotificationPayload } from "../applications/application-service.ts";
import { sendApplicationSubmittedEmail } from "../email/send.ts";
import { createInternalMessageForRecipient } from "../communications/message-template.service.ts";
import { registerUserAccount } from "../auth/user-profile.service.ts";
import { approveApplication } from "../reviews/decision.service.ts";
import { prisma } from "@/lib/prisma/client";
import * as telegramAlertService from "../telegram/alert-service.ts";
import { RuntimeOrchestrator } from "./runtime/runtime-orchestrator.ts";

const stubProvider = (channel: string) => {
  const sends: Array<any> = [];
  return {
    channel: channel as any,
    sends,
    async send(context: any) {
      sends.push(context);
      return { status: "SENT" as const, providerResponse: { channel, recipient: context.recipient } };
    }
  };
};

test.before(() => {
  setCommunicationSettingsForTest({
    enabled: true,
    channels: { email: true, telegram: false, whatsapp: false, internal: false },
    senderEmail: "noreply@example.com",
    telegramBotToken: "",
    telegramChatId: "",
    events: {
      user_registration: true,
      user_login: true,
      eligibility_assessment_started: true,
      eligibility_assessment_completed: true,
      program_matched: true,
      new_recommendation_available: true,
      application_started: true,
      application_submitted: true,
      application_conditional: true,
      application_withdrawn: true,
      document_uploaded: true,
      application_approved: true,
      application_rejected: true,
      application_waitlisted: true,
      documents_requested: true,
      document_approved: true,
      document_rejected: true,
      document_replacement_requested: true,
      rent_to_own_request: true,
      government_program_application: true,
      ngo_program_application: true,
      homeowner_listing_submitted: true,
      ai_conversation_started: true,
      ai_recommendation_generated: true,
      message_created: true,
      admin_action: true,
      ops_alert: true,
      program_published: true,
      staff_invited: true,
      staff_invitation_accepted: true,
      staff_role_changed: true,
      staff_removed: true,
      system_error: true,
      admin_test: true,
      custom_email: true,
      application_under_review: true
    }
  });
});

test("renderNotificationTemplate replaces event placeholders", () => {
  const rendered = renderNotificationTemplate("Hello {{name}} for {{eventName}}", {
    name: "Ada",
    eventName: "user_registration"
  });

  assert.equal(rendered, "Hello Ada for user_registration");
});

test("extractTemplateVariables returns unique variables from a template", () => {
  const rendered = extractTemplateVariables("Hello {{firstName}} {{lastName}} and {{applicationId}}", {
    firstName: "Ada",
    lastName: "Lovelace"
  });

  assert.deepEqual(rendered, ["firstName", "lastName", "applicationId"]);
});

test("buildNotificationTemplateWhere omits locale from the filter to stay compatible with the database", () => {
  assert.deepEqual(buildNotificationTemplateWhere({ channel: "email", locale: "en", active: true, status: "PUBLISHED" }), {
    channel: "email",
    active: true,
    status: "PUBLISHED"
  });
});

test("user_login uses the new runtime pipeline when the feature flag is enabled", async () => {
  const stubEmail = stubProvider("email");
  const originalFlag = process.env.NOTIFICATION_RUNTIME_USER_LOGIN;
  const originalRun = RuntimeOrchestrator.run;
  let orchestratorCalls = 0;

  process.env.NOTIFICATION_RUNTIME_USER_LOGIN = "true";
  RuntimeOrchestrator.run = function (...args: any[]) {
    orchestratorCalls += 1;
    return [{
      event: "user_login",
      audienceRole: "applicant",
      channel: "email",
      recipientId: "recipient-1",
      templateKey: "applicant.user-registration.email",
      metadata: { source: "runtime-orchestrator" }
    }];
  } as typeof RuntimeOrchestrator.run;

  setNotificationProvidersForTest(() => [stubEmail as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "user_login-email",
    eventName: "user_login",
    channel: "email",
    locale: "en",
    title: "Sign-in detected",
    subject: "New sign-in detected",
    html: "<div>New sign-in detected</div>",
    plainText: "New sign-in detected",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => null
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async ({ data }: any) => ({ id: "log-runtime", ...data }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data })
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  try {
    const result = await notificationService.notify("user_login", {
      recipientEmail: "applicant@example.com",
      userId: "user-runtime",
      userEmail: "applicant@example.com",
      name: "Applicant"
    });

    assert.equal(result.delivered, true);
    assert.ok("channels" in result);
    assert.deepEqual(result.channels, ["email"]);
    assert.equal(stubEmail.sends.length, 1);
    assert.equal(orchestratorCalls, 1);
    assert.equal(stubEmail.sends[0].subject, "New sign-in detected");
  } finally {
    RuntimeOrchestrator.run = originalRun;
    if (originalFlag === undefined) {
      delete process.env.NOTIFICATION_RUNTIME_USER_LOGIN;
    } else {
      process.env.NOTIFICATION_RUNTIME_USER_LOGIN = originalFlag;
    }
  }
});

test("other events continue to use the legacy routing path", async () => {
  const stubEmail = stubProvider("email");
  const originalFlag = process.env.NOTIFICATION_RUNTIME_USER_LOGIN;
  const originalRun = RuntimeOrchestrator.run;

  delete process.env.NOTIFICATION_RUNTIME_USER_LOGIN;
  RuntimeOrchestrator.run = function () {
    throw new Error("runtime should not run for legacy events");
  } as typeof RuntimeOrchestrator.run;

  setNotificationProvidersForTest(() => [stubEmail as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "message_created-email",
    eventName: "message_created",
    channel: "email",
    locale: "en",
    title: "New message",
    subject: "You have a new message",
    html: "<div>You have a new message</div>",
    plainText: "You have a new message",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => null
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async ({ data }: any) => ({ id: "log-legacy", ...data }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data })
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  try {
    const result = await notificationService.notify("message_created", {
      recipientEmail: "applicant@example.com",
      userId: "user-legacy",
      userEmail: "applicant@example.com",
      name: "Applicant"
    });

    assert.equal(result.delivered, true);
    assert.ok("channels" in result);
    assert.deepEqual(result.channels, ["email"]);
    assert.equal(stubEmail.sends.length, 1);
  } finally {
    RuntimeOrchestrator.run = originalRun;
    if (originalFlag === undefined) {
      delete process.env.NOTIFICATION_RUNTIME_USER_LOGIN;
    } else {
      process.env.NOTIFICATION_RUNTIME_USER_LOGIN = originalFlag;
    }
  }
});

test("notify sends an email to explicit recipient and persists logs", async () => {
  const stubEmail = stubProvider("email");
  setNotificationProvidersForTest(() => [stubEmail as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "message_created-email",
    eventName: "message_created",
    channel: "email",
    locale: "en",
    title: "New message",
    subject: "You have a new message",
    html: "<div>You have a new message</div>",
    plainText: "You have a new message",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => null
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async ({ data }: any) => ({ id: "log-1", ...data }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data })
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  const result = await notificationService.notify("message_created", {
    recipientEmail: "applicant@example.com",
    userId: "user-1",
    name: "Applicant",
    messagePreview: "Hello from staff"
  });

  assert.equal(result.delivered, true);
  assert.ok("channels" in result);
  assert.ok(Array.isArray(result.channels) && result.channels[0] === "email");
  assert.ok("deliveryResults" in result);
  assert.ok(Array.isArray(result.deliveryResults) && result.deliveryResults[0].recipient === "a***@example.com");
  assert.equal(stubEmail.sends.length, 1);
  assert.equal(stubEmail.sends[0].recipient, "applicant@example.com");
});

test("application submitted payload includes recipientId and organizationId", () => {
  const payload = buildApplicationSubmittedNotificationPayload({
    userId: "user-1",
    userEmail: "applicant@example.com",
    userName: "Applicant Name",
    programId: "program-1",
    organizationId: "org-1",
    applicationId: "app-1"
  });

  assert.equal(payload.userId, "user-1");
  assert.equal(payload.recipientId, "user-1");
  assert.equal(payload.recipientEmail, "applicant@example.com");
  assert.equal(payload.applicationId, "app-1");
  assert.equal(payload.organizationId, "org-1");
});

test("sendApplicationSubmittedEmail passes explicit applicant routing intent", async () => {
  const originalNotify = notificationService.notify;
  let capturedPayload: any;

  (notificationService as any).notify = async (_eventName: string, payload: any) => {
    capturedPayload = payload;
    return { delivered: true, channels: ["email"], deliveryResults: [] };
  };

  try {
    await sendApplicationSubmittedEmail("applicant@example.com", "Applicant");

    assert.equal(capturedPayload.audience, "applicant");
    assert.deepEqual(capturedPayload.deliveryChannels, ["email"]);
    assert.equal(capturedPayload.recipientEmail, "applicant@example.com");
    assert.equal(capturedPayload.userEmail, "applicant@example.com");
  } finally {
    (notificationService as any).notify = originalNotify;
  }
});

test("createInternalMessageForRecipient passes explicit admin routing intent", async () => {
  const originalNotify = notificationService.notify;
  let capturedPayload: any;

  (notificationService as any).notify = async (_eventName: string, payload: any) => {
    capturedPayload = payload;
    return { delivered: true, channels: ["telegram", "internal"], deliveryResults: [] };
  };

  const originalFindUnique = (prisma as any).user?.findUnique;
  (prisma as any).user = {
    ...(prisma as any).user,
    findUnique: async () => ({ id: "user-5", email: "admin@example.com" })
  };

  try {
    await createInternalMessageForRecipient({
      recipientUserId: "user-5",
      senderName: "Staff",
      body: "Hello"
    });

    assert.equal(capturedPayload.audience, "admin");
    assert.deepEqual(capturedPayload.deliveryChannels, ["telegram", "internal"]);
    assert.equal(capturedPayload.recipientEmail, "admin@example.com");
  } finally {
    (notificationService as any).notify = originalNotify;
    if (originalFindUnique) {
      (prisma as any).user.findUnique = originalFindUnique;
    }
  }
});

test("registerUserAccount passes explicit applicant routing intent to notifications", async () => {
  const originalNotify = notificationService.notify;
  let capturedPayload: any;
  const originalQueueTelegramAlert = telegramAlertService.queueTelegramAlert;
  const originalUpsert = (prisma as any).user?.upsert;

  (notificationService as any).notify = async (_eventName: string, payload: any) => {
    capturedPayload = payload;
    return { delivered: true, channels: ["email"], deliveryResults: [] };
  };

  (telegramAlertService as any).queueTelegramAlert = async () => undefined;
  (prisma as any).user = {
    ...(prisma as any).user,
    upsert: async () => ({ id: "user-registered", email: "new-user@example.com", name: "New User", role: "APPLICANT", organizationId: null })
  };

  try {
    await registerUserAccount({ email: "new-user@example.com", name: "New User" });

    assert.equal(capturedPayload.audience, "applicant");
    assert.deepEqual(capturedPayload.deliveryChannels, ["email"]);
    assert.equal(capturedPayload.recipientEmail, "new-user@example.com");
    assert.equal(capturedPayload.userEmail, "new-user@example.com");
  } finally {
    (notificationService as any).notify = originalNotify;
    (telegramAlertService as any).queueTelegramAlert = originalQueueTelegramAlert;
    if (originalUpsert) {
      (prisma as any).user.upsert = originalUpsert;
    }
  }
});

test("approveApplication passes explicit applicant routing intent to notifications", async () => {
  const originalNotify = notificationService.notify;
  let capturedPayload: any;
  const originalTransaction = (prisma as any).$transaction;
  const originalFindUnique = (prisma as any).programApplication?.findUnique;

  (notificationService as any).notify = async (_eventName: string, payload: any) => {
    capturedPayload = payload;
    return { delivered: true, channels: ["email"], deliveryResults: [] };
  };

  (prisma as any).$transaction = async (callback: any) => {
    const tx = {
      programApplication: {
        findUnique: async () => ({
          id: "app-1",
          status: "submitted",
          program: { name: "Test Program", organizationId: "org-1" },
          user: { id: "user-1", name: "Applicant", email: "applicant@example.com" },
        }),
        update: async () => ({})
      },
      caseDecision: {
        create: async () => ({ id: "decision-1" })
      },
      waitlistEntry: {
        deleteMany: async () => ({ count: 0 })
      },
      applicationEvent: {
        create: async () => ({})
      },
      auditLog: {
        create: async () => ({})
      },
      caseConversation: {
        findUnique: async () => null,
        create: async () => ({ id: "conversation-1" }),
        update: async () => ({})
      },
      caseMessage: {
        create: async () => ({})
      }
    };

    return callback(tx);
  };

  (prisma as any).programApplication = {
    ...(prisma as any).programApplication,
    findUnique: async () => ({
      user: { id: "user-1", name: "Applicant", email: "applicant@example.com" },
      program: { name: "Test Program", organizationId: "org-1" }
    })
  };

  try {
    const result = await approveApplication({
      applicationId: "app-1",
      staffUserId: "staff-1",
      internalNotes: "",
      applicantMessage: "Application approved"
    } as any);

    assert.equal(result.success, true);
    assert.equal(capturedPayload.audience, "applicant");
    assert.deepEqual(capturedPayload.deliveryChannels, ["email"]);
    assert.equal(capturedPayload.recipientEmail, "applicant@example.com");
    assert.equal(capturedPayload.userEmail, "applicant@example.com");
  } finally {
    (notificationService as any).notify = originalNotify;
    (prisma as any).$transaction = originalTransaction;
    if (originalFindUnique) {
      (prisma as any).programApplication.findUnique = originalFindUnique;
    }
  }
});

test("shouldDeliverChannel honors explicit notification preference overrides", async () => {
  const settings = {
    enabled: true,
    channels: { email: true, telegram: false, whatsapp: false, internal: false },
    senderEmail: "noreply@example.com",
    telegramBotToken: "",
    telegramChatId: "",
    events: {
      user_registration: true,
      user_login: true,
      eligibility_assessment_started: true,
      eligibility_assessment_completed: true,
      program_matched: true,
      new_recommendation_available: true,
      application_started: true,
      application_submitted: true,
      application_conditional: true,
      application_withdrawn: true,
      document_uploaded: true,
      application_approved: true,
      application_rejected: true,
      application_waitlisted: true,
      documents_requested: true,
      document_approved: true,
      document_rejected: true,
      document_replacement_requested: true,
      rent_to_own_request: true,
      government_program_application: true,
      ngo_program_application: true,
      homeowner_listing_submitted: true,
      ai_conversation_started: true,
      ai_recommendation_generated: true,
      message_created: true,
      admin_action: true,
      ops_alert: true,
      program_published: true,
      staff_invited: true,
      staff_invitation_accepted: true,
      staff_role_changed: true,
      staff_removed: true,
      system_error: true,
      admin_test: true,
      custom_email: true,
      application_under_review: true
    }
  };

  setPrismaClientForTest({
    notificationPreference: {
      findFirst: async () => ({ scopeType: "APPLICANT", eventName: "message_created", channel: "email", enabled: false })
    }
  });

  const enabled = await shouldDeliverChannel(
    settings as any,
    "email",
    "message_created",
    "user-1",
    undefined,
    undefined
  );

  assert.equal(enabled, false);
});

test("notify still sends email when notification log persistence fails", async () => {
  const stubEmail = stubProvider("email");
  setNotificationProvidersForTest(() => [stubEmail as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "message_created-email",
    eventName: "message_created",
    channel: "email",
    locale: "en",
    title: "New message",
    subject: "You have a new message",
    html: "<div>You have a new message</div>",
    plainText: "You have a new message",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => null
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async () => {
        throw new Error("log write failed");
      },
      update: async () => ({})
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  const result = await notificationService.notify("message_created", {
    recipientEmail: "applicant@example.com",
    userId: "user-7",
    name: "Applicant"
  });

  assert.equal(result.delivered, true);
  assert.equal(stubEmail.sends.length, 1);
});

test("notify resolves recipient from userId when recipientEmail is not provided", async () => {
  const stubEmail = stubProvider("email");
  setNotificationProvidersForTest(() => [stubEmail as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "message_created-email",
    eventName: "message_created",
    channel: "email",
    locale: "en",
    title: "New message",
    subject: "You have a new message",
    html: "<div>You have a new message</div>",
    plainText: "You have a new message",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => ({ email: "user-from-db@example.com" })
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async ({ data }: any) => ({ id: "log-2", ...data }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data })
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  const result = await notificationService.notify("message_created", {
    userId: "user-2",
    name: "Recipient"
  });

  assert.equal(result.delivered, true);
  assert.equal(stubEmail.sends[0].recipient, "user-from-db@example.com");
});

test("explicit audience overrides default routing when no delivery channels are supplied", async () => {
  setCommunicationSettingsForTest({
    enabled: true,
    channels: { email: true, telegram: true, whatsapp: false, internal: true },
    senderEmail: "noreply@example.com",
    telegramBotToken: "",
    telegramChatId: "",
    events: {
      user_registration: true,
      user_login: true,
      eligibility_assessment_started: true,
      eligibility_assessment_completed: true,
      program_matched: true,
      new_recommendation_available: true,
      application_started: true,
      application_submitted: true,
      application_conditional: true,
      application_withdrawn: true,
      document_uploaded: true,
      application_approved: true,
      application_rejected: true,
      application_waitlisted: true,
      documents_requested: true,
      document_approved: true,
      document_rejected: true,
      document_replacement_requested: true,
      rent_to_own_request: true,
      government_program_application: true,
      ngo_program_application: true,
      homeowner_listing_submitted: true,
      ai_conversation_started: true,
      ai_recommendation_generated: true,
      message_created: true,
      admin_action: true,
      ops_alert: true,
      program_published: true,
      staff_invited: true,
      staff_invitation_accepted: true,
      staff_role_changed: true,
      staff_removed: true,
      system_error: true,
      admin_test: true,
      custom_email: true,
      application_under_review: true
    }
  });

  const stubEmail = stubProvider("email");
  const stubTelegram = stubProvider("telegram");
  const stubInternal = stubProvider("internal");

  setNotificationProvidersForTest(() => [stubEmail as any, stubTelegram as any, stubInternal as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "application_submitted-email",
    eventName: "application_submitted",
    channel: "email",
    locale: "en",
    title: "Application submitted",
    subject: "Application submitted",
    html: "<div>Application submitted</div>",
    plainText: "Application submitted",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => ({ email: "applicant@example.com" })
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async ({ data }: any) => ({ id: "log-4", ...data }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data })
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  const result = await notificationService.notify("application_submitted", {
    recipientEmail: "applicant@example.com",
    userEmail: "applicant@example.com",
    userId: "user-4",
    name: "Applicant",
    audience: "admin"
  });

  assert.equal(result.delivered, true);
  assert.ok("channels" in result);
  assert.deepEqual(result.channels, ["telegram", "internal"]);
  assert.equal(stubEmail.sends.length, 0);
  assert.equal(stubTelegram.sends.length, 1);
  assert.equal(stubInternal.sends.length, 1);
});

test("user-targeted notifications default to email routing unless explicitly overridden", async () => {
  const stubEmail = stubProvider("email");
  const stubTelegram = stubProvider("telegram");

  setNotificationProvidersForTest(() => [stubEmail as any, stubTelegram as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "user_login-email",
    eventName: "user_login",
    channel: "email",
    locale: "en",
    title: "Welcome back",
    subject: "Welcome back",
    html: "<div>Welcome back</div>",
    plainText: "Welcome back",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => ({ email: "user-target@example.com" })
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async ({ data }: any) => ({ id: "log-5", ...data }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data })
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  const result = await notificationService.notify("user_login", {
    recipientEmail: "user-target@example.com",
    userId: "user-5",
    name: "User"
  });

  assert.equal(result.delivered, true);
  assert.ok("channels" in result);
  assert.deepEqual(result.channels, ["email"]);
  assert.equal(stubEmail.sends.length, 1);
  assert.equal(stubTelegram.sends.length, 0);
});

test("routingPlans can fan out to multiple audiences and channels", async () => {
  setCommunicationSettingsForTest({
    enabled: true,
    channels: { email: true, telegram: true, whatsapp: false, internal: true },
    senderEmail: "noreply@example.com",
    telegramBotToken: "",
    telegramChatId: "",
    events: {
      user_registration: true,
      user_login: true,
      eligibility_assessment_started: true,
      eligibility_assessment_completed: true,
      program_matched: true,
      new_recommendation_available: true,
      application_started: true,
      application_submitted: true,
      application_conditional: true,
      application_withdrawn: true,
      document_uploaded: true,
      application_approved: true,
      application_rejected: true,
      application_waitlisted: true,
      documents_requested: true,
      document_approved: true,
      document_rejected: true,
      document_replacement_requested: true,
      rent_to_own_request: true,
      government_program_application: true,
      ngo_program_application: true,
      homeowner_listing_submitted: true,
      ai_conversation_started: true,
      ai_recommendation_generated: true,
      message_created: true,
      admin_action: true,
      ops_alert: true,
      program_published: true,
      staff_invited: true,
      staff_invitation_accepted: true,
      staff_role_changed: true,
      staff_removed: true,
      system_error: true,
      admin_test: true,
      custom_email: true,
      application_under_review: true
    }
  });

  const stubEmail = stubProvider("email");
  const stubTelegram = stubProvider("telegram");
  const stubInternal = stubProvider("internal");

  setNotificationProvidersForTest(() => [stubEmail as any, stubTelegram as any, stubInternal as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "routing-plans-template",
    eventName: "application_submitted",
    channel: "email",
    locale: "en",
    title: "Application submitted",
    subject: "Application submitted",
    html: "<div>Application submitted</div>",
    plainText: "Application submitted",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => ({ email: "applicant@example.com" })
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async ({ data }: any) => ({ id: "log-6", ...data }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data })
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  const result = await notificationService.notify("application_submitted", {
    recipientEmail: "applicant@example.com",
    userEmail: "applicant@example.com",
    userId: "user-6",
    name: "Applicant",
    routingPlans: [
      { audience: "applicant", channels: ["email"] },
      { audience: "admin", channels: ["telegram", "internal"] }
    ]
  });

  assert.equal(result.delivered, true);
  assert.ok("channels" in result);
  assert.deepEqual(result.channels, ["email", "telegram", "internal"]);
  assert.equal(stubEmail.sends.length, 1);
  assert.equal(stubTelegram.sends.length, 1);
  assert.equal(stubInternal.sends.length, 1);
});

test("application_submitted routes applicant notifications to email only", async () => {
  const stubEmail = stubProvider("email");
  const stubTelegram = stubProvider("telegram");

  setNotificationProvidersForTest(() => [stubEmail as any, stubTelegram as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "application_submitted-email",
    eventName: "application_submitted",
    channel: "email",
    locale: "en",
    title: "Application submitted",
    subject: "Application submitted",
    html: "<div>Application submitted</div>",
    plainText: "Application submitted",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => ({ email: "applicant@example.com" })
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async ({ data }: any) => ({ id: "log-3", ...data }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data })
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  const result = await notificationService.notify("application_submitted", {
    recipientEmail: "applicant@example.com",
    userEmail: "applicant@example.com",
    userId: "user-3",
    name: "Applicant"
  });

  assert.equal(result.delivered, true);
  assert.ok("channels" in result);
  assert.deepEqual(result.channels, ["email"]);
  assert.equal(stubEmail.sends.length, 1);
  assert.equal(stubTelegram.sends.length, 0);
});

test("shadow runtime observes notifications without changing the legacy delivery path", async () => {
  const stubEmail = stubProvider("email");
  const stubTelegram = stubProvider("telegram");
  const stubInternal = stubProvider("internal");
  const warnings: string[] = [];
  const originalWarn = console.warn;

  console.warn = ((message: string, payload?: Record<string, unknown>) => {
    warnings.push(`${message} ${JSON.stringify(payload ?? {})}`);
  }) as typeof console.warn;

  setNotificationProvidersForTest(() => [stubEmail as any, stubTelegram as any, stubInternal as any]);
  setPublishedTemplateForTest(async () => ({
    id: "default",
    name: "application_submitted-email",
    eventName: "application_submitted",
    channel: "email",
    locale: "en",
    title: "Application submitted",
    subject: "Application submitted",
    html: "<div>Application submitted</div>",
    plainText: "Application submitted",
    variables: [],
    status: "PUBLISHED",
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  setPrismaClientForTest({
    user: {
      findUnique: async () => ({ email: "applicant@example.com" })
    },
    notificationPreference: {
      findFirst: async () => null
    },
    notificationLog: {
      create: async ({ data }: any) => ({ id: "log-shadow", ...data }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data })
    },
    communicationTimelineEntry: {
      create: async () => ({})
    }
  });

  try {
    const result = await notificationService.notify("application_submitted", {
      recipientEmail: "applicant@example.com",
      userEmail: "applicant@example.com",
      userId: "user-shadow",
      name: "Applicant",
      audience: "admin"
    });

    assert.equal(result.delivered, true);
    assert.ok("channels" in result);
    assert.ok("channels" in result);
    assert.deepEqual(result.channels, ["telegram", "internal"]);
    assert.equal(stubEmail.sends.length, 0);
    assert.equal(stubTelegram.sends.length, 1);
    assert.equal(stubInternal.sends.length, 1);
    assert.ok(warnings.some((entry) => entry.includes("semantic comparison detected differences")));
  } finally {
    console.warn = originalWarn;
  }
});
