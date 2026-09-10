import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import {
  assertActiveAssignmentReadiness,
  assignPropertyToProgram,
  updateProgramProperty
} from "./admin-program-property.service";

const ready = {
  propertyId: "property-1",
  status: "AVAILABLE",
  checks: {
    organizationAssigned: true,
    requiredDetailsComplete: true,
    unitsEntered: true,
    availableUnits: true,
    imagesEntered: true,
    statusConsistent: true
  },
  availableUnitCount: 1,
  imageCount: 1,
  readyForProgramAssignment: true
};

const assignment = {
  id: "assignment-1",
  organizationId: "org-a",
  programId: "program-a",
  propertyId: "property-a",
  isActive: false,
  availableFrom: null,
  availableUntil: null
};

const completeProperty = {
  id: "property-a",
  organizationId: "org-a",
  title: "Complete home",
  description: "Complete details",
  address: "1 Main Street",
  city: "Austin",
  state: "TX",
  status: "AVAILABLE",
  units: [{ id: "unit-a", available: true }],
  images: [{ id: "image-a" }]
};

function installAssignmentMocks({ program = true, property = completeProperty as typeof completeProperty | null, existingAssignment = assignment as typeof assignment | null } = {}) {
  const upsertCalls: unknown[] = [];
  const updateCalls: unknown[] = [];
  prisma.program.findFirst = (async () => program ? { id: "program-a", organizationId: "org-a", name: "Program A" } : null) as unknown as typeof prisma.program.findFirst;
  prisma.property.findFirst = (async () => property) as unknown as typeof prisma.property.findFirst;
  prisma.programProperty.findFirst = (async () => existingAssignment) as unknown as typeof prisma.programProperty.findFirst;
  prisma.programProperty.upsert = (async (args: { create: unknown }) => {
    upsertCalls.push(args);
    return args.create;
  }) as unknown as typeof prisma.programProperty.upsert;
  prisma.programProperty.update = (async (args: { data: unknown }) => {
    updateCalls.push(args);
    return args.data;
  }) as unknown as typeof prisma.programProperty.update;
  return { updateCalls, upsertCalls };
}

test("allows active assignment for a ready available property", () => {
  assert.doesNotThrow(() => assertActiveAssignmentReadiness(ready, true));
});

test("rejects active assignment when required details are incomplete", () => {
  assert.throws(
    () => assertActiveAssignmentReadiness({ ...ready, checks: { ...ready.checks, requiredDetailsComplete: false }, readyForProgramAssignment: false }, true),
    /PROPERTY_NOT_READY_FOR_ACTIVE_ASSIGNMENT/
  );
});

test("rejects active assignment when units are missing", () => {
  assert.throws(
    () => assertActiveAssignmentReadiness({ ...ready, checks: { ...ready.checks, unitsEntered: false }, readyForProgramAssignment: false }, true),
    /PROPERTY_NOT_READY_FOR_ACTIVE_ASSIGNMENT/
  );
});

test("rejects active assignment when no available unit exists", () => {
  assert.throws(
    () => assertActiveAssignmentReadiness({ ...ready, checks: { ...ready.checks, availableUnits: false }, availableUnitCount: 0, readyForProgramAssignment: false }, true),
    /PROPERTY_NOT_READY_FOR_ACTIVE_ASSIGNMENT/
  );
});

test("rejects active assignment when images are missing", () => {
  assert.throws(
    () => assertActiveAssignmentReadiness({ ...ready, checks: { ...ready.checks, imagesEntered: false }, imageCount: 0, readyForProgramAssignment: false }, true),
    /PROPERTY_NOT_READY_FOR_ACTIVE_ASSIGNMENT/
  );
});

test("rejects active assignment when property status is unavailable", () => {
  assert.throws(
    () => assertActiveAssignmentReadiness({ ...ready, status: "UNAVAILABLE" }, true),
    /PROPERTY_NOT_READY_FOR_ACTIVE_ASSIGNMENT/
  );
});

test("preserves inactive assignment behavior for an unready property", () => {
  assert.doesNotThrow(() => assertActiveAssignmentReadiness({ ...ready, status: "UNAVAILABLE", readyForProgramAssignment: false }, false));
});

test("complete readiness permits reactivation", () => {
  assert.doesNotThrow(() => assertActiveAssignmentReadiness(ready, true));
});

test("incomplete required details reject reactivation", () => {
  assert.throws(
    () => assertActiveAssignmentReadiness({ ...ready, checks: { ...ready.checks, requiredDetailsComplete: false }, readyForProgramAssignment: false }, true),
    /PROPERTY_NOT_READY_FOR_ACTIVE_ASSIGNMENT/
  );
});

test("active assignment uses the real readiness service and preserves organization ownership", async () => {
  const persistence = installAssignmentMocks();
  await assignPropertyToProgram("program-a", "org-a", { propertyId: "property-a", isActive: true });
  assert.equal(persistence.upsertCalls.length, 1);
  assert.equal((persistence.upsertCalls[0] as { create: { isActive: boolean } }).create.isActive, true);
});

test("organization A cannot assign organization B property or program", async () => {
  installAssignmentMocks({ property: null });
  await assert.rejects(assignPropertyToProgram("program-a", "org-a", { propertyId: "property-b", isActive: false }), /PROPERTY_NOT_FOUND_OR_UNASSIGNED/);

  installAssignmentMocks({ program: false });
  await assert.rejects(assignPropertyToProgram("program-b", "org-b", { propertyId: "property-a", isActive: false }), /PROGRAM_NOT_FOUND/);
});

test("inactive assignment remains possible while an unready property is being completed", async () => {
  const persistence = installAssignmentMocks({ property: { ...completeProperty, status: "UNAVAILABLE", units: [], images: [] } });
  await assignPropertyToProgram("program-a", "org-a", { propertyId: "property-a", isActive: false });
  assert.equal((persistence.upsertCalls[0] as { create: { isActive: boolean } }).create.isActive, false);
});

test("invalid availability dates are rejected before assignment persistence", async () => {
  const persistence = installAssignmentMocks();
  await assert.rejects(assignPropertyToProgram("program-a", "org-a", { propertyId: "property-a", availableFrom: "2026-02-01", availableUntil: "2026-01-01" }), /availableUntil must be on or after availableFrom/);
  assert.equal(persistence.upsertCalls.length, 0);
});

test("reactivation uses the real readiness service and rejects an unready property", async () => {
  installAssignmentMocks({ property: { ...completeProperty, title: "" } });
  await assert.rejects(updateProgramProperty("program-a", "assignment-1", "org-a", { isActive: true }), /PROPERTY_NOT_READY_FOR_ACTIVE_ASSIGNMENT/);
});

test("organization A cannot reactivate organization B assignment", async () => {
  installAssignmentMocks({ existingAssignment: null });
  await assert.rejects(updateProgramProperty("program-a", "assignment-b", "org-a", { isActive: true }), /PROGRAM_PROPERTY_NOT_FOUND/);
});
