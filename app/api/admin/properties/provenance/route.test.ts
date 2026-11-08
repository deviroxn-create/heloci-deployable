import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import { GET } from "./route";
import { POST } from "./[id]/route";

const sessionModule = require("@/lib/auth/session") as typeof import("@/lib/auth/session");
const provenanceModule = require("@/lib/properties/property-availability-provenance.service") as typeof import("@/lib/properties/property-availability-provenance.service");

function installAuth(options: { authenticated?: boolean; memberRole?: string; approveFailure?: Error }) {
  const originalGetCurrentUser = sessionModule.getCurrentUser;
  const originalUserFindUnique = prisma.user.findUnique;
  const originalMemberFindUnique = prisma.organizationMember.findUnique;
  const originalReport = provenanceModule.getUnknownAvailabilityProvenanceReport;
  const originalApprove = provenanceModule.approveUnknownAvailabilityProvenance;
  let approvalInput: unknown;

  sessionModule.getCurrentUser = (async () => options.authenticated === false ? null : ({
    id: "staff-user",
    organizationId: "org-a",
    role: options.memberRole === "org_admin" ? "STAFF" : "APPLICANT",
    isPlatformAdmin: false
  })) as typeof sessionModule.getCurrentUser;
  prisma.user.findUnique = (async () => ({ role: "STAFF", organizationId: "org-a", email: "staff@example.test" })) as unknown as typeof prisma.user.findUnique;
  prisma.organizationMember.findUnique = (async () => options.memberRole
    ? { id: "member-a", organizationId: "org-a", userId: "staff-user", role: options.memberRole, createdAt: new Date() }
    : null) as unknown as typeof prisma.organizationMember.findUnique;
  provenanceModule.getUnknownAvailabilityProvenanceReport = (async (organizationId: string) => ({
    organizationId,
    generatedAt: new Date(0).toISOString(),
    totalUnknown: 0,
    categories: { strongAutomaticEvidence: 0, staffReviewRequired: 0, notEligibleForAutomaticApproval: 0 },
    listingCategories: { rental: 0, sale: 0, unknown: 0 },
    currentAvailability: {},
    publicationStatus: {},
    candidates: []
  })) as typeof provenanceModule.getUnknownAvailabilityProvenanceReport;
  provenanceModule.approveUnknownAvailabilityProvenance = (async (input: unknown) => {
    approvalInput = input;
    if (options.approveFailure) throw options.approveFailure;
    return { propertyId: "property-a", availabilityStatusSource: "STAFF", availabilityStatus: "UNAVAILABLE", publicationStatus: "PENDING_REVIEW" };
  }) as typeof provenanceModule.approveUnknownAvailabilityProvenance;

  return {
    get approvalInput() { return approvalInput; },
    restore() {
      sessionModule.getCurrentUser = originalGetCurrentUser;
      prisma.user.findUnique = originalUserFindUnique;
      prisma.organizationMember.findUnique = originalMemberFindUnique;
      provenanceModule.getUnknownAvailabilityProvenanceReport = originalReport;
      provenanceModule.approveUnknownAvailabilityProvenance = originalApprove;
    }
  };
}

test("provenance report requires authentication and organization-admin membership", async () => {
  const unauthenticated = installAuth({ authenticated: false });
  try {
    assert.equal((await GET()).status, 401);
  } finally {
    unauthenticated.restore();
  }

  for (const role of ["applicant", "case_worker"]) {
    const nonAdmin = installAuth({ memberRole: role });
    try {
      assert.equal((await GET()).status, 403);
    } finally {
      nonAdmin.restore();
    }
  }

  const admin = installAuth({ memberRole: "org_admin" });
  try {
    const response = await GET();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).organizationId, "org-a");
  } finally {
    admin.restore();
  }
});

test("approval API derives organization and actor from the authorized session", async () => {
  const auth = installAuth({ memberRole: "org_admin" });
  try {
    const response = await POST(new Request("https://example.test/api/admin/properties/provenance/property-a", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: "org-other",
        decision: "STAFF",
        reason: "Confirmed manually by staff.",
        confirmIntentionalAvailability: true,
        evidenceToken: "current-token"
      })
    }), { params: Promise.resolve({ id: "property-a" }) });
    assert.equal(response.status, 200);
    assert.deepEqual(auth.approvalInput, {
      organizationId: "org-a",
      propertyId: "property-a",
      actorUserId: "staff-user",
      decision: "STAFF",
      reason: "Confirmed manually by staff.",
      confirmIntentionalAvailability: true,
      expectedEvidenceToken: "current-token"
    });
  } finally {
    auth.restore();
  }
});

test("approval API rejects non-admins, short reasons, and unconfirmed staff decisions", async () => {
  const body = {
    decision: "STAFF",
    reason: "A meaningful administrator review.",
    confirmIntentionalAvailability: true,
    evidenceToken: "current-token"
  };
  const request = (overrides: Record<string, unknown> = {}) => new Request("https://example.test/api/admin/properties/provenance/property-a", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, ...overrides })
  });
  const context = { params: Promise.resolve({ id: "property-a" }) };

  const worker = installAuth({ memberRole: "case_worker" });
  try {
    assert.equal((await POST(request(), context)).status, 403);
  } finally {
    worker.restore();
  }

  const admin = installAuth({ memberRole: "org_admin" });
  try {
    assert.equal((await POST(request({ reason: "short" }), context)).status, 400);
    assert.equal((await POST(request({ confirmIntentionalAvailability: false }), context)).status, 400);
    assert.equal(admin.approvalInput, undefined);
  } finally {
    admin.restore();
  }
});

test("serializable transaction conflicts are returned as stale-review conflicts", async () => {
  const conflict = Object.assign(new Error("serialization failure"), { code: "P2034" });
  const auth = installAuth({ memberRole: "org_admin", approveFailure: conflict });
  try {
    const response = await POST(new Request("https://example.test/api/admin/properties/provenance/property-a", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision: "STAFF",
        reason: "Confirmed manually by staff.",
        confirmIntentionalAvailability: true,
        evidenceToken: "current-token"
      })
    }), { params: Promise.resolve({ id: "property-a" }) });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "PROVENANCE_CONCURRENT_UPDATE" });
  } finally {
    auth.restore();
  }
});
