import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import {
  ApplicantPropertyInterestError,
  assertApplicationMatchesProgramProperty,
  expressApplicantPropertyInterest,
  getApplicantPropertyInterest,
  withdrawApplicantPropertyInterest
} from "./applicant-property-interest.service";

const programProperty = { programId: "program-1", organizationId: "org-1" };
const approvedApplication = {
  id: "application-1",
  userId: "applicant-1",
  status: "approved",
  program: { id: "program-1", organizationId: "org-1" }
};

const availableProgramProperty = {
  id: "program-property-1",
  organizationId: "org-1",
  programId: "program-1",
  isActive: true,
  availableFrom: null,
  availableUntil: null,
  property: { status: "AVAILABLE", units: [{ id: "unit-1" }] }
};

const interestRecord = {
  id: "interest-1",
  status: "INTERESTED",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01")
};

type InterestKey = { programApplicationId: string; programPropertyId: string };
type UpsertArgs = { where: { programApplicationId_programPropertyId: InterestKey }; create: InterestKey & { status: string }; update: { status: string } };
type UpdateManyArgs = { where: InterestKey; data: { status: string } };
type FindUniqueArgs = { where: { programApplicationId_programPropertyId: InterestKey }; select: Record<string, boolean> };

function installPersistenceMocks(application: typeof approvedApplication | null = approvedApplication) {
  const upsertCalls: unknown[] = [];
  const updateManyCalls: unknown[] = [];
  const findUniqueCalls: unknown[] = [];
  const interests = new Map<string, typeof interestRecord>();

  prisma.programProperty.findUnique = (async () => availableProgramProperty) as unknown as typeof prisma.programProperty.findUnique;
  prisma.programApplication.findFirst = (async () => application) as unknown as typeof prisma.programApplication.findFirst;
  prisma.applicantPropertyInterest.upsert = (async (args: UpsertArgs) => {
    upsertCalls.push(args);
    const key = `${args.where.programApplicationId_programPropertyId.programApplicationId}:${args.where.programApplicationId_programPropertyId.programPropertyId}`;
    const existing = interests.get(key);
    const record = existing ? { ...existing, status: args.update.status } : { ...interestRecord };
    interests.set(key, record);
    return record;
  }) as unknown as typeof prisma.applicantPropertyInterest.upsert;
  prisma.applicantPropertyInterest.updateMany = (async (args: UpdateManyArgs) => {
    updateManyCalls.push(args);
    const key = `${args.where.programApplicationId}:${args.where.programPropertyId}`;
    const existing = interests.get(key);
    if (existing) interests.set(key, { ...existing, status: args.data.status });
    return { count: existing ? 1 : 0 };
  }) as unknown as typeof prisma.applicantPropertyInterest.updateMany;
  prisma.applicantPropertyInterest.findUnique = (async (args: FindUniqueArgs) => {
    findUniqueCalls.push(args);
    const key = `${args.where.programApplicationId_programPropertyId.programApplicationId}:${args.where.programApplicationId_programPropertyId.programPropertyId}`;
    return interests.get(key) ?? null;
  }) as unknown as typeof prisma.applicantPropertyInterest.findUnique;

  return { findUniqueCalls, interests, updateManyCalls, upsertCalls };
}

test("accepts one approved application for the matching program and organization", () => {
  assert.doesNotThrow(() => assertApplicationMatchesProgramProperty("applicant-1", approvedApplication, programProperty));
});

test("rejects an application belonging to another applicant", () => {
  assert.throws(
    () => assertApplicationMatchesProgramProperty("applicant-2", approvedApplication, programProperty),
    ApplicantPropertyInterestError
  );
});

test("rejects an application that is not approved", () => {
  assert.throws(
    () => assertApplicationMatchesProgramProperty("applicant-1", { ...approvedApplication, status: "pending" }, programProperty),
    ApplicantPropertyInterestError
  );
});

test("rejects an application for a different program", () => {
  assert.throws(
    () => assertApplicationMatchesProgramProperty("applicant-1", { ...approvedApplication, program: { id: "program-2", organizationId: "org-1" } }, programProperty),
    ApplicantPropertyInterestError
  );
});

test("rejects an application from a different organization", () => {
  assert.throws(
    () => assertApplicationMatchesProgramProperty("applicant-1", { ...approvedApplication, program: { id: "program-1", organizationId: "org-2" } }, programProperty),
    ApplicantPropertyInterestError
  );
});

test("rejects a missing application instead of selecting another approved application", () => {
  assert.throws(
    () => assertApplicationMatchesProgramProperty("applicant-1", null, programProperty),
    ApplicantPropertyInterestError
  );
});

test("creates one interest for one approved application", async () => {
  const persistence = installPersistenceMocks();
  const interest = await expressApplicantPropertyInterest("applicant-1", "application-1", "program-property-1");

  assert.equal(interest.status, "INTERESTED");
  assert.equal(persistence.upsertCalls.length, 1);
  assert.deepEqual(persistence.upsertCalls[0], {
    where: { programApplicationId_programPropertyId: { programApplicationId: "application-1", programPropertyId: "program-property-1" } },
    create: { programApplicationId: "application-1", programPropertyId: "program-property-1", status: "INTERESTED" },
    update: { status: "INTERESTED" }
  });
});

test("different approved programs can only operate on their matching property assignment", async () => {
  const persistence = installPersistenceMocks({ ...approvedApplication, program: { id: "program-2", organizationId: "org-1" } });

  await assert.rejects(
    expressApplicantPropertyInterest("applicant-1", "application-2", "program-property-1"),
    ApplicantPropertyInterestError
  );
  assert.equal(persistence.upsertCalls.length, 0);
});

test("re-interest reactivates only the selected application/property pair", async () => {
  const persistence = installPersistenceMocks();
  await expressApplicantPropertyInterest("applicant-1", "application-1", "program-property-1");
  await withdrawApplicantPropertyInterest("applicant-1", "application-1", "program-property-1");
  await expressApplicantPropertyInterest("applicant-1", "application-1", "program-property-1");

  assert.equal(persistence.interests.size, 1);
  assert.equal(persistence.interests.get("application-1:program-property-1")?.status, "INTERESTED");
  assert.deepEqual(persistence.updateManyCalls[0], {
    where: { programPropertyId: "program-property-1", programApplicationId: "application-1" },
    data: { status: "WITHDRAWN" }
  });
});

test("withdrawal only affects the selected application/property pair", async () => {
  const persistence = installPersistenceMocks();
  await expressApplicantPropertyInterest("applicant-1", "application-1", "program-property-1");
  await withdrawApplicantPropertyInterest("applicant-1", "application-1", "program-property-1");

  assert.equal(persistence.interests.get("application-1:program-property-1")?.status, "WITHDRAWN");
  assert.equal(persistence.interests.has("application-2:program-property-1"), false);
});

test("repeated creation uses the composite key instead of creating a second interest", async () => {
  const persistence = installPersistenceMocks();
  await expressApplicantPropertyInterest("applicant-1", "application-1", "program-property-1");
  await expressApplicantPropertyInterest("applicant-1", "application-1", "program-property-1");

  assert.equal(persistence.upsertCalls.length, 2);
  assert.equal(persistence.interests.size, 1);
  assert.deepEqual(persistence.upsertCalls[1], persistence.upsertCalls[0]);
});

test("missing application IDs do not fall back to another approved application", async () => {
  const persistence = installPersistenceMocks(null);

  await assert.rejects(
    expressApplicantPropertyInterest("applicant-1", "missing-application", "program-property-1"),
    ApplicantPropertyInterestError
  );
  assert.equal(persistence.upsertCalls.length, 0);
});

test("GET reads only the selected composite relationship", async () => {
  const persistence = installPersistenceMocks();
  await getApplicantPropertyInterest("applicant-1", "application-1", "program-property-1");

  assert.deepEqual(persistence.findUniqueCalls[0], {
    where: { programApplicationId_programPropertyId: { programApplicationId: "application-1", programPropertyId: "program-property-1" } },
    select: { id: true, status: true, createdAt: true, updatedAt: true }
  });
});