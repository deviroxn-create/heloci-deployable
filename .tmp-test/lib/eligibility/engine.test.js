"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const engine_1 = require("./engine");
(0, node_test_1.default)("qualifies a teacher for teacher housing when income and employment match", () => {
    const rule = {
        and: [
            { "==": [{ var: "employment.status" }, "teacher"] },
            { ">=": [{ var: "income.monthly" }, 3000] }
        ]
    };
    const profile = {
        employment: { status: "teacher" },
        income: { monthlyIncome: 3000, employmentStatus: "teacher" }
    };
    const result = (0, engine_1.evaluateEligibilityRule)(rule, profile);
    strict_1.default.equal(result.isEligible, true);
    strict_1.default.ok(result.matched.some((item) => item.includes("Employment")));
});
(0, node_test_1.default)("rejects rent-to-own civil when the employment rule fails", () => {
    const rule = {
        and: [
            { "==": [{ var: "employment.status" }, "government_employee"] },
            { ">=": [{ var: "income.monthly" }, 2500] }
        ]
    };
    const profile = {
        employment: { status: "teacher" },
        income: { monthlyIncome: 3000, employmentStatus: "teacher" }
    };
    const result = (0, engine_1.evaluateEligibilityRule)(rule, profile);
    strict_1.default.equal(result.isEligible, false);
    strict_1.default.ok(result.failed.some((item) => item.includes("Employment")));
});
(0, node_test_1.default)("sums score blocks for priority ranking", () => {
    const rule = {
        and: [
            { ">=": [{ var: "income.monthly" }, 2000] },
            { score: 20 },
            { score: 15 }
        ]
    };
    const profile = {
        income: { monthlyIncome: 2500 }
    };
    const result = (0, engine_1.evaluateEligibilityRule)(rule, profile);
    strict_1.default.equal(result.isEligible, true);
    strict_1.default.equal(result.score, 35);
});
(0, node_test_1.default)("uses the latest active version of a rule", () => {
    const versions = [
        { version: 1, isActive: false, rules: { "==": [{ var: "employment.status" }, "teacher"] } },
        { version: 2, isActive: true, rules: { "==": [{ var: "employment.status" }, "government_employee"] } }
    ];
    const active = (0, engine_1.resolveActiveRule)(versions);
    strict_1.default.equal(active?.version, 2);
});
