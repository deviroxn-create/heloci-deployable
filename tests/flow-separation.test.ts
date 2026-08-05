import test from "node:test";
import assert from "node:assert/strict";
import { assertApplicationCreationInput } from "../services/application.service";

test("eligibility flow should stay distinct from application creation", () => {
  assert.doesNotThrow(() => assertApplicationCreationInput("user-1", "program-1", "Test Program"));
  assert.throws(() => assertApplicationCreationInput("user-1", "", "Test Program"), /Program required/);
});

test("application creation requires a program id", () => {
  assert.throws(() => assertApplicationCreationInput("user-1", "", "Test Program"), /Program required/);
});
