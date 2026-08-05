import test from "node:test";
import assert from "node:assert/strict";
import { TemplateResolver } from "./template-resolver";
import type { CommunicationPlan } from "./communication-plan.types";

const resolver = new TemplateResolver();

const applicantPlan: CommunicationPlan = {
  event: "application_submitted",
  audienceRole: "applicant",
  recipientId: "user-1",
  preferredChannel: "email",
  priority: 100,
  metadata: { audienceName: "Applicant" }
};

const adminPlan: CommunicationPlan = {
  event: "application_submitted",
  audienceRole: "organization_admin",
  recipientId: "admin-1",
  preferredChannel: "telegram",
  priority: 90,
  metadata: { audienceName: "Organization Admin" }
};

const reviewerPlan: CommunicationPlan = {
  event: "application_submitted",
  audienceRole: "reviewer",
  recipientId: "reviewer-1",
  preferredChannel: "internal",
  priority: 80,
  metadata: { audienceName: "Reviewer" }
};

test("application_submitted resolves the expected template per audience and channel", () => {
  assert.deepStrictEqual(resolver.resolve(applicantPlan), {
    event: "application_submitted",
    audienceRole: "applicant",
    channel: "email",
    templateKey: "applicant.application-submitted.email",
    locale: "en",
    version: 1
  });

  assert.deepStrictEqual(resolver.resolve(adminPlan), {
    event: "application_submitted",
    audienceRole: "organization_admin",
    channel: "telegram",
    templateKey: "admin.application-submitted.telegram",
    locale: "en",
    version: 1
  });

  assert.deepStrictEqual(resolver.resolve(reviewerPlan), {
    event: "application_submitted",
    audienceRole: "reviewer",
    channel: "internal",
    templateKey: "reviewer.application-submitted.internal",
    locale: "en",
    version: 1
  });
});

test("different audiences receive different templates", () => {
  const applicantResolution = resolver.resolve(applicantPlan);
  const adminResolution = resolver.resolve(adminPlan);

  assert.notEqual(applicantResolution.templateKey, adminResolution.templateKey);
});

test("same event + different channel resolves correctly", () => {
  const emailPlan: CommunicationPlan = { ...applicantPlan, preferredChannel: "email" };
  const telegramPlan: CommunicationPlan = { ...applicantPlan, preferredChannel: "telegram" };

  assert.equal(resolver.resolve(emailPlan).templateKey, "applicant.application-submitted.email");
  assert.equal(resolver.resolve(telegramPlan).templateKey, "applicant.application-submitted.telegram");
});

test("unknown event returns unresolved", () => {
  const unresolved = resolver.resolve({ ...applicantPlan, event: "unknown_event" });
  assert.equal(unresolved.templateKey, null);
  assert.equal(unresolved.event, "unknown_event");
});

test("resolver output is deterministic", () => {
  const first = resolver.resolve(applicantPlan);
  const second = resolver.resolve(applicantPlan);

  assert.deepStrictEqual(first, second);
});

test("no duplicate logic is required for repeated resolutions", () => {
  const first = resolver.resolve(applicantPlan);
  const second = resolver.resolve({ ...applicantPlan, recipientId: "user-2" });

  assert.equal(first.templateKey, second.templateKey);
  assert.equal(first.audienceRole, second.audienceRole);
  assert.equal(first.channel, second.channel);
});
