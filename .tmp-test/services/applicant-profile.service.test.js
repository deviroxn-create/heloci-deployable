"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const applicant_profile_service_1 = require("./applicant-profile.service");
(0, node_test_1.default)("calculateProfileCompleteness returns a percentage for incomplete profiles", () => {
    const profile = (0, applicant_profile_service_1.normalizeApplicantProfile)({
        personal: { fullName: "Ada Lovelace", phone: "555-0100" },
        household: { householdSize: 2 },
        income: { monthlyIncome: 3200 }
    });
    const result = (0, applicant_profile_service_1.calculateProfileCompleteness)(profile);
    strict_1.default.equal(result.score, 50);
    strict_1.default.equal(result.status, "IN_PROGRESS");
});
(0, node_test_1.default)("normalizeApplicantProfile adds default sections and documents", () => {
    const profile = (0, applicant_profile_service_1.normalizeApplicantProfile)({ personal: { fullName: "Ada" } });
    strict_1.default.deepEqual(profile.documents, []);
    strict_1.default.equal(profile.personal?.fullName, "Ada");
    strict_1.default.equal(profile.household?.householdSize, undefined);
    strict_1.default.deepEqual(profile.preferences?.preferredLocations, []);
});
(0, node_test_1.default)("mapLegacyProfileData maps legacy payloads into the structured profile shape", () => {
    const mapped = (0, applicant_profile_service_1.mapLegacyProfileData)({ full_name: "Ada", household_size: 3, monthly_income: 2500, housing_goal: "Family" });
    strict_1.default.equal(mapped.personal?.fullName, "Ada");
    strict_1.default.equal(mapped.household?.householdSize, 3);
    strict_1.default.equal(mapped.income?.monthlyIncome, 2500);
    strict_1.default.equal(mapped.preferences?.housingGoal, "Family");
});
(0, node_test_1.default)("saveApplicantProfile returns profile data and completeness", async () => {
    const result = await (0, applicant_profile_service_1.saveApplicantProfile)({ userId: "user-1", personal: { fullName: "Ada" }, household: { householdSize: 2 }, income: { monthlyIncome: 2500 } }, { skipNotification: true, skipLegacyWrite: true });
    strict_1.default.equal(result.profile.personal?.fullName, "Ada");
    strict_1.default.equal(result.completeness.status, "IN_PROGRESS");
});
