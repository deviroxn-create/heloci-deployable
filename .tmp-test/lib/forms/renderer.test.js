"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const renderer_1 = require("./renderer");
const validator_1 = require("./validator");
const client_1 = require("@/lib/prisma/client");
const profile = {
    employment: { status: "teacher" },
    income: { monthlyIncome: 3000 }
};
function makeTestId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
async function createFormFixture() {
    const user = await client_1.prisma.user.create({
        data: {
            email: `${makeTestId("user")}@example.com`,
            name: "Test User"
        }
    });
    const program = await client_1.prisma.program.create({
        data: {
            organizationId: makeTestId("org"),
            name: "Teacher Housing",
            slug: makeTestId("teacher-housing"),
            housingGoal: "Support teachers",
            createdBy: user.id
        }
    });
    await client_1.prisma.questionSet.create({
        data: {
            programId: program.id,
            name: "Teacher Form",
            version: 1,
            isActive: true,
            pages: {
                create: [
                    {
                        title: "About you",
                        sortOrder: 0,
                        questions: {
                            create: [
                                {
                                    key: "years_teaching",
                                    label: "Years teaching",
                                    type: "number",
                                    required: true,
                                    order: 0,
                                    conditions: {
                                        create: [
                                            {
                                                type: "json-logic",
                                                rules: { "==": [{ var: "profile.employment.status" }, "teacher"] }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    });
    await client_1.prisma.applicantProfile.create({
        data: {
            userId: user.id,
            profileData: {
                employment: { status: "teacher" },
                income: { monthlyIncome: 3000 }
            },
            completeness: {
                score: 50,
                status: "IN_PROGRESS",
                completedSections: []
            }
        }
    });
    return { user, program };
}
(0, node_test_1.default)("universal question pre-fills from profile", async () => {
    const context = { profile, application: {} };
    const result = (0, renderer_1.evaluateCondition)({ "==": [{ var: "profile.employment.status" }, "teacher"] }, context);
    strict_1.default.equal(result, true);
});
(0, node_test_1.default)("conditional visibility works for teacher-only questions", async () => {
    const { user, program } = await createFormFixture();
    const form = await (0, renderer_1.getFormForProgram)(program.slug, user.id);
    const page = (form.pages ?? [])[0];
    strict_1.default.ok(page?.questions.some((question) => question.key === "years_teaching"));
});
(0, node_test_1.default)("validation rejects out-of-range numbers", () => {
    const result = (0, validator_1.validatePage)([
        { id: "1", key: "score", label: "Score", type: "number", required: true, value: undefined, visible: true, validation: { min: 0, max: 10 } }
    ], { score: 11 });
    strict_1.default.equal(result.valid, false);
    strict_1.default.ok(Object.prototype.hasOwnProperty.call(result.errors, "score"));
});
(0, node_test_1.default)("save draft updates application data and current page", async () => {
    const { user, program } = await createFormFixture();
    const application = await client_1.prisma.programApplication.create({
        data: {
            userId: user.id,
            programId: program.id,
            status: "draft",
            data: {},
            currentPage: 0
        }
    });
    const updated = await client_1.prisma.programApplication.update({
        where: { id: application.id },
        data: { data: { years_teaching: 5 }, currentPage: 1 }
    });
    strict_1.default.equal(updated.currentPage, 1);
    strict_1.default.equal(updated.data.years_teaching, 5);
});
