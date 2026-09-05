import test from "node:test";
import assert from "node:assert/strict";

import { buildFallbackCurrentUser } from "../lib/auth/session";
import { documentStorageService } from "../lib/documents/storage.service";
import { verifyFileIntegrity } from "../lib/documents/secure-access.service";

test("buildFallbackCurrentUser returns a usable session for sign-in fallback", () => {
  const result = buildFallbackCurrentUser(
    {
      id: "supabase-user-1",
      email: "applicant@example.com",
      user_metadata: { full_name: "Test Applicant" }
    } as any,
    "applicant@example.com"
  );

  assert.equal(result.email, "applicant@example.com");
  assert.equal(result.name, "Test Applicant");
  assert.equal(result.role, "APPLICANT");
  assert.equal(result.isPlatformAdmin, false);
});

test("documentStorageService returns secure preview URLs instead of raw static paths", () => {
  const secureUrl = documentStorageService.getViewUrl("/uploads/documents/legacy-file.pdf", "doc_123");

  assert.equal(secureUrl, "/api/documents/doc_123/preview");
});

test("document integrity rejects path traversal and uses non-public storage", async () => {
  const result = await verifyFileIntegrity("/storage/documents/../../.env");

  assert.equal(result.exists, false);
  assert.equal(result.readable, false);
  assert.equal(result.path, "");
});
