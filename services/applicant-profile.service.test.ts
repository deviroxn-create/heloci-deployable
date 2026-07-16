import test from "node:test";
import assert from "node:assert/strict";
import { calculateProfileCompleteness, mapLegacyProfileData, normalizeApplicantProfile, saveApplicantProfile } from "./applicant-profile.service";

test("calculateProfileCompleteness returns a percentage for incomplete profiles", () => {
  const profile = normalizeApplicantProfile({
    personal: { fullName: "Ada Lovelace", phone: "555-0100" },
    household: { householdSize: 2 },
    income: { monthlyIncome: 3200 }
  });

  const result = calculateProfileCompleteness(profile);

  assert.equal(result.score, 50);
  assert.equal(result.status, "IN_PROGRESS");
});

test("normalizeApplicantProfile adds default sections and documents", () => {
  const profile = normalizeApplicantProfile({ personal: { fullName: "Ada" } });

  assert.deepEqual(profile.documents, []);
  assert.equal(profile.personal?.fullName, "Ada");
  assert.equal(profile.household?.householdSize, undefined);
  assert.deepEqual(profile.preferences?.preferredLocations, []);
});

test("mapLegacyProfileData maps legacy payloads into the structured profile shape", () => {
  const mapped = mapLegacyProfileData({ full_name: "Ada", household_size: 3, monthly_income: 2500, housing_goal: "Family" });

  assert.equal(mapped.personal?.fullName, "Ada");
  assert.equal(mapped.household?.householdSize, 3);
  assert.equal(mapped.income?.monthlyIncome, 2500);
  assert.equal(mapped.preferences?.housingGoal, "Family");
});

test("saveApplicantProfile returns profile data and completeness", async () => {
  const result = await saveApplicantProfile({ userId: "user-1", personal: { fullName: "Ada" }, household: { householdSize: 2 }, income: { monthlyIncome: 2500 } }, { skipNotification: true, skipLegacyWrite: true });

  assert.equal(result.profile.personal?.fullName, "Ada");
  assert.equal(result.completeness.status, "IN_PROGRESS");
});
