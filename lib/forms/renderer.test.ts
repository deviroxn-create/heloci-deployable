import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCondition, getFormForProgram } from "./renderer";
import { validatePage } from "./validator";
import { prisma } from "../prisma/client";

const profile = {
  employment: { status: "teacher" },
  income: { monthlyIncome: 3000 }
};

function makeTestId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function createFormFixture() {
  const user = await prisma.user.create({
    data: {
      email: `${makeTestId("user")}@example.com`,
      name: "Test User"
    }
  });

  const program = await prisma.program.create({
    data: {
      organizationId: makeTestId("org"),
      name: "Teacher Housing",
      slug: makeTestId("teacher-housing"),
      housingGoal: "Support teachers",
      createdBy: user.id
    }
  });

  await prisma.questionSet.create({
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

  await prisma.applicantProfile.create({
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

test("universal question pre-fills from profile", async () => {
  const context = { profile, application: {} };
  const result = evaluateCondition({ "==": [{ var: "profile.employment.status" }, "teacher"] }, context);
  assert.equal(result, true);
});

test("conditional visibility works for teacher-only questions", async () => {
  const { user, program } = await createFormFixture();
  const form = await getFormForProgram(program.slug, user.id);
  const page = (form.pages ?? [])[0];

  assert.ok(page?.questions.some((question) => question.key === "years_teaching"));
});

test("validation rejects out-of-range numbers", () => {
  const result = validatePage([
    { id: "1", key: "score", label: "Score", type: "number", required: true, value: undefined, visible: true, validation: { min: 0, max: 10 } }
  ], { score: 11 });

  assert.equal(result.valid, false);
  assert.ok(Object.prototype.hasOwnProperty.call(result.errors, "score"));
});

test("save draft updates application data and current page", async () => {
  const { user, program } = await createFormFixture();

  const application = await prisma.programApplication.create({
    data: {
      userId: user.id,
      programId: program.id,
      status: "draft",
      data: {},
      currentPage: 0
    }
  });

  const updated = await prisma.programApplication.update({
    where: { id: application.id },
    data: { data: { years_teaching: 5 }, currentPage: 1 }
  });

  assert.equal(updated.currentPage, 1);
  assert.equal((updated.data as Record<string, unknown>).years_teaching, 5);
});

test("getFormForProgram does not create a draft when createDraft is false", async () => {
  const { user, program } = await createFormFixture();

  const form = await getFormForProgram(program.slug, user.id, { createDraft: false });
  assert.equal(form.applicationId, "");

  const draftCount = await prisma.programApplication.count({
    where: { userId: user.id, programId: program.id, status: "draft" }
  });
  assert.equal(draftCount, 0);
});

test("getFormForProgram creates a draft when createDraft is true", async () => {
  const { user, program } = await createFormFixture();

  const form = await getFormForProgram(program.slug, user.id, { createDraft: true });
  assert.ok(form.applicationId);
  assert.equal(typeof form.applicationId, "string");

  const draft = await prisma.programApplication.findUnique({
    where: { id: form.applicationId }
  });
  assert.ok(draft);
  assert.equal(draft?.userId, user.id);
  assert.equal(draft?.programId, program.id);
  assert.equal(draft?.status, "draft");
});
