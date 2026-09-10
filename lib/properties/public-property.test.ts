import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import { getPublicPropertyById, listPublicProperties, countPublicProperties } from "./public-property.service";

type PublicProperty = {
  id: string;
  organizationId: string | null;
  status: string;
  units: Array<{ id: string; available: boolean }>;
  images: Array<{ id: string; url: string; altText: string | null }>;
};

const visibleProperty: PublicProperty = {
  id: "property-visible",
  organizationId: "org-a",
  status: "AVAILABLE",
  units: [{ id: "unit-1", available: true }],
  images: []
};

function installPublicMocks(properties: PublicProperty[]) {
  const findManyCalls: unknown[] = [];
  const findFirstCalls: unknown[] = [];
  const countCalls: unknown[] = [];
  prisma.property.findMany = (async (args: unknown) => {
    findManyCalls.push(args);
    return properties.filter((property) => property.organizationId !== null && property.status === "AVAILABLE" && property.units.some((unit) => unit.available));
  }) as unknown as typeof prisma.property.findMany;
  prisma.property.findFirst = (async (args: { where?: { id?: string } }) => {
    findFirstCalls.push(args);
    return properties.find((property) => property.id === args.where?.id && property.organizationId !== null && property.status === "AVAILABLE" && property.units.some((unit) => unit.available)) ?? null;
  }) as unknown as typeof prisma.property.findFirst;
  prisma.property.count = (async (args: unknown) => {
    countCalls.push(args);
    return properties.filter((property) => property.organizationId !== null && property.status === "AVAILABLE" && property.units.some((unit) => unit.available)).length;
  }) as unknown as typeof prisma.property.count;
  return { findFirstCalls, findManyCalls, countCalls };
}

test("public listing returns only the service's visible property query with default pagination", async () => {
  const persistence = installPublicMocks([visibleProperty]);
  const result = await listPublicProperties();

  assert.deepEqual(result, [visibleProperty]);
  assert.deepEqual(persistence.findManyCalls[0], {
    where: { organizationId: { not: null }, status: "AVAILABLE", units: { some: { available: true } } },
    include: { images: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
    skip: 0
  });
});

test("public listing supports custom limit and offset", async () => {
  const persistence = installPublicMocks([visibleProperty]);
  const result = await listPublicProperties({ limit: 12, offset: 24 });

  assert.deepEqual(result, [visibleProperty]);
  assert.deepEqual(persistence.findManyCalls[0], {
    where: { organizationId: { not: null }, status: "AVAILABLE", units: { some: { available: true } } },
    include: { images: true },
    orderBy: { updatedAt: "desc" },
    take: 12,
    skip: 24
  });
});

test("public count returns total eligible properties", async () => {
  const persistence = installPublicMocks([visibleProperty]);
  const result = await countPublicProperties();

  assert.deepEqual(result, 1);
  assert.deepEqual(persistence.countCalls[0], {
    where: { organizationId: { not: null }, status: "AVAILABLE", units: { some: { available: true } } }
  });
});

test("public detail lookup rejects arbitrary and non-public properties", async () => {
  const persistence = installPublicMocks([visibleProperty]);

  assert.deepEqual(await getPublicPropertyById("unknown-property"), null);
  assert.deepEqual(persistence.findFirstCalls[0], {
    where: {
      id: "unknown-property",
      organizationId: { not: null },
      status: "AVAILABLE",
      units: { some: { available: true } }
    },
    include: { images: true }
  });

  for (const property of [
    { ...visibleProperty, id: "no-units", units: [] },
    { ...visibleProperty, id: "unavailable", status: "UNAVAILABLE" },
    { ...visibleProperty, id: "unowned", organizationId: null }
  ]) {
    installPublicMocks([property]);
    assert.deepEqual(await getPublicPropertyById(property.id), null);
  }
});
