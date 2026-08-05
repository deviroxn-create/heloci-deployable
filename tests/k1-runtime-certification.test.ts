import test from "node:test";
import assert from "node:assert/strict";
import { RuntimeOrchestrator } from "../lib/notifications/runtime/runtime-orchestrator";

test("runtime orchestrator creates distinct audience plans and templates for registration and application events", async () => {
  const registrationTrace = await RuntimeOrchestrator.runWithTrace("user_registration", {
    userId: "user-1",
    userEmail: "applicant@example.com",
    organizationAdminId: "admin-1",
    organizationAdminEmail: "admin@example.com",
  });

  assert.equal(registrationTrace.eventName, "user_registration");
  assert.equal(registrationTrace.audiences.length, 2);
  assert.deepEqual(
    registrationTrace.audiences.map((audience) => audience.role),
    ["applicant", "organization_admin"]
  );
  assert.deepEqual(
    registrationTrace.plans.map((plan) => ({ audienceRole: plan.audienceRole, preferredChannel: plan.preferredChannel })),
    [
      { audienceRole: "applicant", preferredChannel: "email" },
      { audienceRole: "organization_admin", preferredChannel: "telegram" },
    ]
  );
  assert.deepEqual(
    registrationTrace.dispatchRequests.map((request) => ({ audienceRole: request.audienceRole, channel: request.channel, templateKey: request.templateKey })),
    [
      { audienceRole: "applicant", channel: "email", templateKey: "applicant.user-registration.email" },
      { audienceRole: "organization_admin", channel: "telegram", templateKey: "admin.user-registration.telegram" },
    ]
  );

  const applicationTrace = await RuntimeOrchestrator.runWithTrace("application_submitted", {
    userId: "user-2",
    userEmail: "applicant@example.com",
    organizationAdminId: "admin-2",
    organizationAdminEmail: "admin@example.com",
    reviewerId: "reviewer-1",
    reviewerEmail: "reviewer@example.com",
    caseWorkerId: "caseworker-1",
    caseWorkerEmail: "caseworker@example.com",
    supportEmail: "support@example.com",
  });

  assert.equal(applicationTrace.eventName, "application_submitted");
  assert.equal(applicationTrace.audiences.length, 5);
  assert.deepEqual(
    applicationTrace.dispatchRequests.map((request) => ({ audienceRole: request.audienceRole, channel: request.channel, templateKey: request.templateKey })),
    [
      { audienceRole: "applicant", channel: "email", templateKey: "applicant.application-submitted.email" },
      { audienceRole: "organization_admin", channel: "telegram", templateKey: "admin.application-submitted.telegram" },
      { audienceRole: "reviewer", channel: "internal", templateKey: "reviewer.application-submitted.internal" },
      { audienceRole: "case_worker", channel: "internal", templateKey: "case-worker.application-submitted.internal" },
      { audienceRole: "support", channel: "email", templateKey: "support.application-submitted.email" },
    ]
  );
});
