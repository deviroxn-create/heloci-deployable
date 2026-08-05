import test from "node:test";
import assert from "node:assert/strict";
import {
  getOperationOrganizationId,
  normalizeCommunicationScope,
} from "../lib/communications/scope.service";
import { buildApplicationSubmittedNotificationPayload } from "../lib/applications/application-service";

test("legacy string organization ids are normalized to an organization scope", () => {
  const scope = normalizeCommunicationScope("org-42", "user-1");

  assert.deepEqual(scope, {
    mode: "organization",
    organizationId: "org-42",
    userId: "user-1",
    isPlatform: false,
    canViewAllOrganizations: false,
    canSendAsAnyOrganization: false,
    selectedOrganizationId: null,
  });
});

test("platform scopes resolve the selected organization for RBAC and service operations", () => {
  const scope = normalizeCommunicationScope(
    { id: "admin-1", role: "SUPER_ADMIN", organizationId: null },
    "admin-1",
    "org-99"
  );

  assert.equal(getOperationOrganizationId(scope), "org-99");
});

test("application submission notifications carry the applicant email address", () => {
  const payload = buildApplicationSubmittedNotificationPayload({
    userId: "user-1",
    userEmail: "ada@example.com",
    userName: "Ada Lovelace",
    programId: "program-1",
    applicationId: "app-1",
  });

  assert.equal(payload.userId, "user-1");
  assert.equal(payload.userEmail, "ada@example.com");
  assert.equal(payload.recipientEmail, "ada@example.com");
  assert.equal(payload.name, "Ada Lovelace");
  assert.equal(payload.applicationId, "app-1");
});
