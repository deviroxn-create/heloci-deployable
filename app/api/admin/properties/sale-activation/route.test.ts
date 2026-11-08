import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import { POST } from "./route";

const sessionModule = require("@/lib/auth/session") as typeof import("@/lib/auth/session");
const activationModule = require("@/lib/properties/property-sale-activation.service") as typeof import("@/lib/properties/property-sale-activation.service");

function installAuth(options: { authenticated?: boolean; memberRole?: string }) {
  const originalGetCurrentUser = sessionModule.getCurrentUser;
  const originalUserFindUnique = prisma.user.findUnique;
  const originalMemberFindUnique = prisma.organizationMember.findUnique;
  const originalPreview = activationModule.previewAuthorizedSaleActivation;
  const originalActivate = activationModule.activateAuthorizedSaleInventory;
  let previewOrganizationId: string | null = null;
  let activationInput: unknown;

  sessionModule.getCurrentUser = (async () => options.authenticated === false ? null : ({
    id: "admin-user",
    organizationId: "org_heloci",
    role: "STAFF",
    isPlatformAdmin: false
  })) as typeof sessionModule.getCurrentUser;
  prisma.user.findUnique = (async () => ({ role: "STAFF", organizationId: "org_heloci", email: "admin@example.test" })) as unknown as typeof prisma.user.findUnique;
  prisma.organizationMember.findUnique = (async () => options.memberRole
    ? { id: "member-1", organizationId: "org_heloci", userId: "admin-user", role: options.memberRole, createdAt: new Date() }
    : null) as unknown as typeof prisma.organizationMember.findUnique;
  activationModule.previewAuthorizedSaleActivation = (async (organizationId: string) => {
    previewOrganizationId = organizationId;
    return { organizationId, mode: "DRY_RUN", candidateCount: 416 };
  }) as typeof activationModule.previewAuthorizedSaleActivation;
  activationModule.activateAuthorizedSaleInventory = (async (input: unknown) => {
    activationInput = input;
    return {
      organizationId: "org_heloci",
      mode: "EXECUTED",
      activatedCount: 416,
      auditVerified: true,
      persistedStateVerified: true
    };
  }) as typeof activationModule.activateAuthorizedSaleInventory;

  return {
    get previewOrganizationId() { return previewOrganizationId; },
    get activationInput() { return activationInput; },
    restore() {
      sessionModule.getCurrentUser = originalGetCurrentUser;
      prisma.user.findUnique = originalUserFindUnique;
      prisma.organizationMember.findUnique = originalMemberFindUnique;
      activationModule.previewAuthorizedSaleActivation = originalPreview;
      activationModule.activateAuthorizedSaleInventory = originalActivate;
    }
  };
}

function request(body: Record<string, unknown>) {
  return new Request("https://example.test/api/admin/properties/sale-activation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("sale activation preview requires an authenticated organization admin", async () => {
  const unauthenticated = installAuth({ authenticated: false });
  try {
    assert.equal((await POST(request({ dryRun: true }))).status, 401);
  } finally {
    unauthenticated.restore();
  }

  const worker = installAuth({ memberRole: "case_worker" });
  try {
    assert.equal((await POST(request({ dryRun: true }))).status, 403);
  } finally {
    worker.restore();
  }

  const admin = installAuth({ memberRole: "org_admin" });
  try {
    const response = await POST(request({ dryRun: true, organizationId: "org-other" }));
    assert.equal(response.status, 200);
    assert.equal(admin.previewOrganizationId, "org_heloci");
    assert.equal((await response.json()).candidateCount, 416);
  } finally {
    admin.restore();
  }
});

test("sale activation execution requires confirmation and derives actor from session", async () => {
  const admin = installAuth({ memberRole: "org_admin" });
  try {
    assert.equal((await POST(request({
      dryRun: false,
      confirm: false,
      previewToken: "preview",
      approvedPropertyIds: ["property-1"]
    }))).status, 400);
    assert.equal(admin.activationInput, undefined);

    const response = await POST(request({
      dryRun: false,
      confirm: true,
      previewToken: "fresh-preview",
      approvedPropertyIds: ["property-1"],
      organizationId: "org-other"
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(admin.activationInput, {
      organizationId: "org_heloci",
      actorUserId: "admin-user",
      expectedPreviewToken: "fresh-preview",
      approvedPropertyIds: ["property-1"],
      approvedScopeDigest: activationModule.APPROVED_SALE_SCOPE_ID_DIGEST
    });
  } finally {
    admin.restore();
  }
});
