import test from "node:test";
import assert from "node:assert/strict";
import { AudienceResolver } from "./audience-resolver";

const resolver = new AudienceResolver();

test("application_submitted returns the expected audiences when recipient data is present", async () => {
  const audiences = await resolver.resolve("application_submitted", {
    userId: "user-1",
    userEmail: "applicant@example.com",
    organizationAdminId: "admin-1",
    organizationAdminEmail: "admin@example.com",
    reviewerId: "reviewer-1",
    reviewerEmail: "reviewer@example.com",
    caseWorkerId: "caseworker-1",
    caseWorkerEmail: "caseworker@example.com",
    supportEmail: "support@example.com"
  });

  assert.deepStrictEqual(audiences, [
    {
      role: "applicant",
      name: "Applicant",
      recipient: { type: "user", userId: "user-1", email: "applicant@example.com" }
    },
    {
      role: "organization_admin",
      name: "Organization Admin",
      recipient: { type: "user", userId: "admin-1", email: "admin@example.com" }
    },
    {
      role: "reviewer",
      name: "Reviewer",
      recipient: { type: "user", userId: "reviewer-1", email: "reviewer@example.com" }
    },
    {
      role: "case_worker",
      name: "Case Worker",
      recipient: { type: "user", userId: "caseworker-1", email: "caseworker@example.com" }
    },
    {
      role: "support",
      name: "Support",
      recipient: { type: "email", email: "support@example.com" }
    }
  ]);
});

test("unknown events return an empty audience list", async () => {
  assert.deepStrictEqual(await resolver.resolve("unknown_event", { userId: "user-1" }), []);
});

test("organization admin is resolved from user organization membership when explicit admin payload is absent", async () => {
  const originalFindUnique = prisma.user.findUnique;
  const originalFindFirst = prisma.organizationMember.findFirst;

  try {
    (prisma.user as any).findUnique = async () => ({ organizationId: "org-1" });
    (prisma.organizationMember as any).findFirst = async () => ({
      user: {
        id: "admin-1",
        email: "admin@example.com"
      }
    });

    const audiences = await resolver.resolve("user_registration", {
      userId: "user-1",
      userEmail: "applicant@example.com"
    });

    assert.deepStrictEqual(audiences, [
      {
        role: "applicant",
        name: "Applicant",
        recipient: { type: "user", userId: "user-1", email: "applicant@example.com" }
      },
      {
        role: "organization_admin",
        name: "Organization Admin",
        recipient: { type: "user", userId: "admin-1", email: "admin@example.com" }
      }
    ]);
  } finally {
    (prisma.user as any).findUnique = originalFindUnique;
    (prisma.organizationMember as any).findFirst = originalFindFirst;
  }
});

test("duplicate audience identities are collapsed", async () => {
  const audiences = await resolver.resolve("message_created", {
    recipientId: "user-1",
    recipientEmail: "applicant@example.com",
    userId: "user-1",
    userEmail: "applicant@example.com"
  });

  assert.deepStrictEqual(audiences, [
    {
      role: "applicant",
      name: "Applicant",
      recipient: { type: "user", userId: "user-1", email: "applicant@example.com" }
    }
  ]);
});

test("missing payload is handled safely", async () => {
  assert.deepStrictEqual(await resolver.resolve("application_submitted", {}), []);
  assert.deepStrictEqual(await resolver.resolve("user_registration", undefined as never), []);
});

test("resolver returns a stable typed audience shape", async () => {
  const audiences = await resolver.resolve("user_registration", { userEmail: "new-user@example.com" });

  assert.equal(audiences.length, 1);
  assert.equal(audiences[0].role, "applicant");
  assert.equal(audiences[0].name, "Applicant");
  assert.equal(audiences[0].recipient?.type, "email");
  assert.equal(audiences[0].recipient?.email, "new-user@example.com");
});
