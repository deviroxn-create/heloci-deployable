import test from "node:test";
import assert from "node:assert/strict";
import { buildOrganizationEmailNotificationPayloads } from "../lib/communications/manual-email-payloads";

test("manual organization emails build one notification payload per recipient", () => {
  const payloads = buildOrganizationEmailNotificationPayloads({
    subject: "Welcome",
    content: "Hello there",
    organizationId: "org-1",
    senderId: "user-1",
    senderIdentityId: "identity-1",
    recipients: [
      { email: "applicant@example.com", name: "Ada" },
      { email: "staff@example.com", name: "Grace" },
    ],
  });

  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].recipientEmail, "applicant@example.com");
  assert.equal(payloads[0].recipient, "applicant@example.com");
  assert.equal(payloads[0].title, "Welcome");
  assert.equal(payloads[0].body, "Hello there");
  assert.equal(payloads[0].organizationId, "org-1");
  assert.equal(payloads[0].senderIdentityId, "identity-1");
});
