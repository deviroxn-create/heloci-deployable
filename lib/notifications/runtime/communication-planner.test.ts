import test from "node:test";
import assert from "node:assert/strict";
import { CommunicationPlanner } from "./communication-planner";
import type { Audience } from "./audience.types";

const planner = new CommunicationPlanner();

const applicantAudience: Audience = {
  role: "applicant",
  name: "Applicant",
  recipient: { type: "user", userId: "user-1", email: "applicant@example.com" }
};

const adminAudience: Audience = {
  role: "organization_admin",
  name: "Organization Admin",
  recipient: { type: "user", userId: "admin-1", email: "admin@example.com" }
};

const reviewerAudience: Audience = {
  role: "reviewer",
  name: "Reviewer",
  recipient: { type: "user", userId: "reviewer-1", email: "reviewer@example.com" }
};

const caseWorkerAudience: Audience = {
  role: "case_worker",
  name: "Case Worker",
  recipient: { type: "user", userId: "caseworker-1", email: "caseworker@example.com" }
};

test("application_submitted produces one plan per audience/channel", () => {
  const plans = planner.plan("application_submitted", [applicantAudience, adminAudience, reviewerAudience, caseWorkerAudience]);

  assert.deepStrictEqual(plans, [
    {
      event: "application_submitted",
      audienceRole: "applicant",
      recipientId: "user-1",
      preferredChannel: "email",
      priority: 100,
      metadata: { audienceName: "Applicant" }
    },
    {
      event: "application_submitted",
      audienceRole: "organization_admin",
      recipientId: "admin-1",
      preferredChannel: "telegram",
      priority: 90,
      metadata: { audienceName: "Organization Admin" }
    },
    {
      event: "application_submitted",
      audienceRole: "reviewer",
      recipientId: "reviewer-1",
      preferredChannel: "internal",
      priority: 80,
      metadata: { audienceName: "Reviewer" }
    },
    {
      event: "application_submitted",
      audienceRole: "case_worker",
      recipientId: "caseworker-1",
      preferredChannel: "internal",
      priority: 70,
      metadata: { audienceName: "Case Worker" }
    }
  ]);
});

test("duplicate audiences produce one plan", () => {
  const plans = planner.plan("user_registration", [applicantAudience, applicantAudience]);

  assert.deepStrictEqual(plans, [
    {
      event: "user_registration",
      audienceRole: "applicant",
      recipientId: "user-1",
      preferredChannel: "email",
      priority: 100,
      metadata: { audienceName: "Applicant" }
    }
  ]);
});

test("unknown events return an empty list", () => {
  assert.deepStrictEqual(planner.plan("unknown_event", [applicantAudience]), []);
});

test("missing audiences are handled safely", () => {
  assert.deepStrictEqual(planner.plan("application_submitted", []), []);
  assert.deepStrictEqual(planner.plan("message_created", undefined as never), []);
});

test("planner output is deterministic", () => {
  const first = planner.plan("message_created", [applicantAudience, adminAudience]);
  const second = planner.plan("message_created", [adminAudience, applicantAudience]);

  assert.deepStrictEqual(first, second);
});
