import test from "node:test";
import assert from "node:assert/strict";
import { getMissingApplicantDocuments, hasCompleteApplicantDocuments } from "../lib/documents/applicant-requirements";
import { sanitizeApplicationData } from "../lib/notifications/application-telegram-summary";

const complete = (identityType: "national_id" | "visa" | "drivers_license", income: "w2" | "ein") => {
  const identity = {
    national_id: ["national_id_front", "national_id_back"],
    visa: ["visa_front", "visa_back"],
    drivers_license: ["drivers_license_front", "drivers_license_back"],
  }[identityType];
  return {
    identityType,
    uploads: [...identity, "utility_bill", income === "w2" ? "w2" : "ein_documentation"].map((type) => ({ type })),
  };
};

test("national ID with W-2 is valid", () => assert.equal(hasCompleteApplicantDocuments(complete("national_id", "w2")), true));
test("visa with EIN is valid", () => assert.equal(hasCompleteApplicantDocuments(complete("visa", "ein")), true));
test("driver's license with W-2 is valid", () => assert.equal(hasCompleteApplicantDocuments(complete("drivers_license", "w2")), true));
test("missing identity front reports the front requirement", () => {
  const input = complete("visa", "ein");
  input.uploads = input.uploads.filter(({ type }) => type !== "visa_front");
  assert.deepEqual(getMissingApplicantDocuments(input), ["Upload the front of your visa."]);
});
test("missing identity back reports the back requirement", () => {
  const input = complete("drivers_license", "w2");
  input.uploads = input.uploads.filter(({ type }) => type !== "drivers_license_back");
  assert.deepEqual(getMissingApplicantDocuments(input), ["Upload the back of your driver's license."]);
});
test("missing utility bill does not block submission", () => {
  const input = complete("national_id", "w2");
  input.uploads = input.uploads.filter(({ type }) => type !== "utility_bill");
  assert.deepEqual(getMissingApplicantDocuments(input), []);
});
test("missing W-2 and EIN does not block submission", () => {
  const input = complete("national_id", "w2");
  input.uploads = input.uploads.filter(({ type }) => type !== "w2");
  input.uploads = input.uploads.filter(({ type }) => type !== "ein_documentation");
  assert.deepEqual(getMissingApplicantDocuments(input), []);
});
test("both W-2 and EIN are accepted", () => {
  const input = complete("visa", "w2");
  input.uploads.push({ type: "ein_documentation" });
  assert.equal(hasCompleteApplicantDocuments(input), true);
});
test("only the selected identity type is required", () => {
  const input = complete("drivers_license", "w2");
  assert.equal(hasCompleteApplicantDocuments(input), true);
  assert.deepEqual(getMissingApplicantDocuments({ identityType: "drivers_license", uploads: input.uploads }), []);
});
test("no identity selection is invalid", () => {
  const input = complete("drivers_license", "w2");
  assert.deepEqual(getMissingApplicantDocuments({ uploads: input.uploads }), ["Choose one identity document."]);
});

test("identity alone is sufficient for each allowed identity choice", () => {
  for (const identityType of ["national_id", "visa", "drivers_license"] as const) {
    assert.equal(hasCompleteApplicantDocuments({
      identityType,
      uploads: complete(identityType, "w2").uploads.filter(({ type }) => type.startsWith(identityType === "national_id" ? "national_id" : identityType === "visa" ? "visa" : "drivers_license")),
    }), true);
  }
});

test("Telegram application data masks sensitive values and removes private URLs", () => {
  const safe = JSON.stringify(sanitizeApplicationData({
    ssn: "123456789",
    accountNumber: "9876543210",
    routingNumber: "021000021",
    password: "not-for-telegram",
    fileUrl: "private-storage-reference",
    ordinaryAnswer: "Housing answer",
  }));
  assert.match(safe, /\*\*\*-\*\*-6789/);
  assert.doesNotMatch(safe, /123456789|9876543210|021000021|not-for-telegram|private-storage-reference/);
  assert.match(safe, /Housing answer/);
});
