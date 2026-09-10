import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import { importProperties } from "./property-import.service";

const validProperty = {
  externalId: "source-1",
  title: "The Dawson",
  description: "A housing listing",
  address: "1 Main Street",
  city: "Tampa",
  state: "FL",
  zip: "33613",
  rent: 1240,
  rentMax: 2090,
  bedrooms: 1,
  bathrooms: null,
  sqft: null,
  amenities: [],
  specialOffers: [],
  availabilityCount: 120,
  status: "AVAILABLE",
  units: [
    { externalId: "source-1-unit-0", bedrooms: 1, bathrooms: 1, rent: 1324, sqft: null, isAvailable: true }
  ],
  images: ["https://example.com/home.jpg", "https://example.com/home.jpg"],
  lat: 28.08,
  lng: -82.4
};

function mockPropertyLookup(existing: { id: string; organizationId: string } | null) {
  prisma.property.findUnique = (async () => existing) as unknown as typeof prisma.property.findUnique;
}

test("dry-run normalizes nullable fields, reports warnings, and does not write", async () => {
  mockPropertyLookup(null);
  const result = await importProperties({ dryRun: true, properties: [validProperty] }, { organizationId: "org-a" });

  assert.equal(result.status, "DRY_RUN");
  assert.deepEqual(result.summary, { received: 1, created: 1, updated: 0, skipped: 0, failed: 0 });
  assert.equal(result.results[0].status, "CREATED");
  assert.ok(result.results[0].warnings.some((warning) => warning.includes("schema-required placeholder 0")));
  assert.ok(result.results[0].warnings.some((warning) => warning.includes("availabilityCount")));
});

test("duplicate external IDs fail individually", async () => {
  const result = await importProperties([validProperty, { ...validProperty, title: "Duplicate" }], { organizationId: "org-a", dryRun: true });

  assert.equal(result.summary.failed, 2);
  assert.ok(result.results.every((item) => item.errors[0] === "Duplicate externalId in this import"));
});

test("invalid properties produce a failure without database lookup", async () => {
  const result = await importProperties([{ externalId: "bad", title: "" }], { organizationId: "org-a", dryRun: true });

  assert.equal(result.summary.failed, 1);
  assert.equal(result.results[0].status, "FAILED");
  assert.ok(result.results[0].errors.some((error) => error.includes("description")));
});

test("existing property in another organization is rejected", async () => {
  mockPropertyLookup({ id: "property-1", organizationId: "org-b" });
  const result = await importProperties({ dryRun: true, properties: [validProperty] }, { organizationId: "org-a" });

  assert.equal(result.summary.failed, 1);
  assert.equal(result.results[0].errors[0], "Property belongs to another organization");
});

test("real import persists represented units and deduplicated images without replacing availabilityCount", async () => {
  mockPropertyLookup(null);
  const propertyCreates: unknown[] = [];
  const unitCreates: unknown[] = [];
  const imageCreates: unknown[] = [];
  const transaction = {
    property: {
      create: async (args: { data: unknown }) => {
        propertyCreates.push(args);
        return { id: "property-1" };
      },
      update: async () => ({ id: "property-1" })
    },
    propertyUnit: {
      findMany: async () => [],
      create: async (args: { data: unknown }) => {
        unitCreates.push(args);
        return args.data;
      },
      update: async () => ({})
    },
    propertyImage: {
      findFirst: async () => null,
      create: async (args: { data: unknown }) => {
        imageCreates.push(args);
        return args.data;
      },
      update: async () => ({})
    }
  };
  (prisma as unknown as { $transaction: (callback: (tx: typeof transaction) => Promise<unknown>) => Promise<unknown> }).$transaction = (callback) => callback(transaction);

  const result = await importProperties([validProperty], { organizationId: "org-a" });

  assert.equal(result.summary.created, 1);
  assert.equal(propertyCreates.length, 1);
  assert.equal((propertyCreates[0] as { data: { availabilityCount: number } }).data.availabilityCount, 120);
  assert.equal(unitCreates.length, 1);
  assert.equal(imageCreates.length, 1);
});