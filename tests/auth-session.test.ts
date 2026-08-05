import test from "node:test";
import assert from "node:assert/strict";

import { buildFallbackCurrentUser } from "../lib/auth/session";

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
