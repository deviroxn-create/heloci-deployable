import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import { getApprovedApplicantProperties } from "./applicant-property-discovery.service";

const discoveredProperty = {
  id: "property-a",
  externalId: null,
  title: "Available home",
  description: "A home",
  address: "1 Main Street",
  city: "Austin",
  state: "TX",
  zip: "78701",
  latitude: null,
  longitude: null,
  rent: 1200,
  rentMax: null,
  bedrooms: 2,
  bathrooms: 1,
  sqft: 900,
  amenities: [],
  specialOffers: [],
  availabilityCount: 1,
  status: "AVAILABLE",
  images: [],
  units: [{ id: "unit-a", beds: 2, price: 1200, available: true }]
};

type AvailabilityWhere = {
  isActive: boolean;
  OR: Array<{ availableFrom: null | { lte: Date } }>;
  AND: Array<{ OR: Array<{ availableUntil: null | { gte: Date } }> }>;
  property: { status: string; units: { some: { available: boolean } } };
};

test("approved applicant discovery returns the exact application and program-property context", async () => {
  let query: unknown;
  prisma.programApplication.findMany = (async (args: { where?: unknown }) => {
    query = args;
    return [{
      id: "application-a",
      program: {
        id: "program-a",
        name: "Housing Program",
        slug: "housing-program",
        organizationId: "org-a",
        programProperties: [{
          id: "program-property-a",
          isActive: true,
          availableFrom: null,
          availableUntil: null,
          property: discoveredProperty
        }]
      }
    }];
  }) as unknown as typeof prisma.programApplication.findMany;

  const result = await getApprovedApplicantProperties("applicant-a");

  assert.deepEqual(result, [{
    applicationId: "application-a",
    program: { id: "program-a", name: "Housing Program", slug: "housing-program", organizationId: "org-a" },
    properties: [{ programPropertyId: "program-property-a", availableFrom: null, availableUntil: null, property: discoveredProperty }]
  }]);
  assert.deepEqual((query as { where: unknown }).where, { userId: "applicant-a", status: "approved" });
});

test("discovery query requires active date-valid assignments and available units", async () => {
  let query: unknown;
  prisma.programApplication.findMany = (async (args: { select?: unknown }) => {
    query = args;
    return [];
  }) as unknown as typeof prisma.programApplication.findMany;

  await getApprovedApplicantProperties("applicant-a");
  const where = (query as { select: { program: { select: { programProperties: { where: AvailabilityWhere } } } } }).select.program.select.programProperties.where;
  assert.equal(where.isActive, true);
  assert.equal(where.OR[0].availableFrom, null);
  assert.ok(where.OR[1].availableFrom && "lte" in where.OR[1].availableFrom);
  assert.equal(where.AND[0].OR[0].availableUntil, null);
  assert.ok(where.AND[0].OR[1].availableUntil && "gte" in where.AND[0].OR[1].availableUntil);
  assert.deepEqual(where.property, { status: "AVAILABLE", units: { some: { available: true } } });
});
