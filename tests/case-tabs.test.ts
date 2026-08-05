import test from "node:test";
import assert from "node:assert/strict";
import { resolveActiveTab } from "../lib/admin/case-tabs";

test("resolveActiveTab returns the communication tab for the matching query param", () => {
  assert.equal(resolveActiveTab("communication"), "communication");
});

test("resolveActiveTab falls back to profile for unknown or missing values", () => {
  assert.equal(resolveActiveTab(null), "profile");
  assert.equal(resolveActiveTab("unknown"), "profile");
});
