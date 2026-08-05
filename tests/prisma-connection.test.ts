import test from "node:test";
import assert from "node:assert/strict";

import { buildPrismaConnectionUrl } from "../lib/prisma/connection";

test("buildPrismaConnectionUrl adds connection_limit when missing", () => {
  const result = buildPrismaConnectionUrl(
    "postgresql://user:pass@host/db?sslmode=require",
    "25"
  );

  assert.equal(
    result,
    "postgresql://user:pass@host/db?sslmode=require&connection_limit=25"
  );
});

test("buildPrismaConnectionUrl preserves an existing connection_limit", () => {
  const result = buildPrismaConnectionUrl(
    "postgresql://user:pass@host/db?sslmode=require&connection_limit=10",
    "25"
  );

  assert.equal(
    result,
    "postgresql://user:pass@host/db?sslmode=require&connection_limit=10"
  );
});
