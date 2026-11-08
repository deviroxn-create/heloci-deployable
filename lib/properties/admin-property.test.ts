import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import {
  addPropertyImage,
  addPropertyUnit,
  createPropertyForOrganization,
  deletePropertyImage,
  deletePropertyUnit,
  getPropertyEntryReadiness,
  getPropertyForOrganization,
  updatePropertyForOrganization,
  updatePropertyUnit
} from "./admin-property.service";

type TestProperty = {
  id: string;
  organizationId: string | null;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  rent: number;
  listingType: string | null;
  salePrice?: number | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  status: string;
  availabilityStatusSource: "AUTOMATIC" | "STAFF" | "UNKNOWN";
  availabilityCount: number;
  units: Array<{ id: string; beds: number; price: number; available: boolean }>;
  images: Array<{ id: string; url: string; altText: string | null }>;
};

const completeProperty: TestProperty = {
  id: "property-a",
  organizationId: "org-a",
  title: "Complete home",
  description: "A complete listing",
  address: "1 Main Street",
  city: "Austin",
  state: "TX",
  zip: "78701",
  rent: 1200,
  listingType: "For Rent",
  bedrooms: 2,
  bathrooms: 1,
  sqft: 900,
  status: "AVAILABLE",
  availabilityStatusSource: "AUTOMATIC",
  availabilityCount: 1,
  units: [{ id: "unit-a", beds: 2, price: 1200, available: true }],
  images: [{ id: "image-a", url: "https://example.com/home.jpg", altText: null }]
};

function installPropertyMocks(property: TestProperty | null) {
  const unitCreateCalls: unknown[] = [];
  const unitUpdateCalls: unknown[] = [];
  const unitDeleteCalls: unknown[] = [];
  const imageCreateCalls: unknown[] = [];
  const imageDeleteCalls: unknown[] = [];
  const availabilityUpdates: unknown[] = [];

  prisma.property.findFirst = (async () => property) as unknown as typeof prisma.property.findFirst;
  prisma.property.findUnique = (async () => property) as unknown as typeof prisma.property.findUnique;
  prisma.propertyUnit.create = (async (args: { data: unknown }) => {
    unitCreateCalls.push(args);
    return args.data;
  }) as unknown as typeof prisma.propertyUnit.create;
  prisma.propertyUnit.updateMany = (async (args: { where: unknown; data: unknown }) => {
    unitUpdateCalls.push(args);
    return { count: property ? 1 : 0 };
  }) as unknown as typeof prisma.propertyUnit.updateMany;
  prisma.propertyUnit.deleteMany = (async (args: { where: unknown }) => {
    unitDeleteCalls.push(args);
    return { count: property ? 1 : 0 };
  }) as unknown as typeof prisma.propertyUnit.deleteMany;
  prisma.propertyUnit.findUnique = (async () => property?.units[0] ?? null) as unknown as typeof prisma.propertyUnit.findUnique;
  prisma.propertyUnit.count = (async () => property?.units.filter((unit) => unit.available).length ?? 0) as unknown as typeof prisma.propertyUnit.count;
  prisma.propertyImage.create = (async (args: { data: unknown }) => {
    imageCreateCalls.push(args);
    return args.data;
  }) as unknown as typeof prisma.propertyImage.create;
  prisma.propertyImage.deleteMany = (async (args: { where: unknown }) => {
    imageDeleteCalls.push(args);
    return { count: property ? 1 : 0 };
  }) as unknown as typeof prisma.propertyImage.deleteMany;
  prisma.property.update = (async (args: { data: unknown }) => {
    availabilityUpdates.push(args);
    return args.data;
  }) as unknown as typeof prisma.property.update;

  return { availabilityUpdates, imageCreateCalls, imageDeleteCalls, unitCreateCalls, unitDeleteCalls, unitUpdateCalls };
}

test("organization-scoped property reads and edits reject another organization's property", async () => {
  installPropertyMocks(null);
  assert.equal(await getPropertyForOrganization("org-b", "property-a"), null);
  await assert.rejects(updatePropertyForOrganization("org-b", "property-a", { title: "No access" }), /PROPERTY_NOT_FOUND/);
});

test("unit and image mutations reject another organization's property", async () => {
  const persistence = installPropertyMocks(null);

  await assert.rejects(addPropertyUnit("org-b", "property-a", { beds: 2, price: 1200 }), /PROPERTY_NOT_FOUND/);
  await assert.rejects(updatePropertyUnit("org-b", "property-a", "unit-a", { beds: 2, price: 1200 }), /PROPERTY_NOT_FOUND/);
  await assert.rejects(deletePropertyUnit("org-b", "property-a", "unit-a"), /PROPERTY_NOT_FOUND/);
  await assert.rejects(addPropertyImage("org-b", "property-a", { url: "https://example.com/other.jpg" }), /PROPERTY_NOT_FOUND/);
  await assert.rejects(deletePropertyImage("org-b", "property-a", "image-a"), /PROPERTY_NOT_FOUND/);
  assert.equal(persistence.unitCreateCalls.length, 0);
  assert.equal(persistence.unitUpdateCalls.length, 0);
  assert.equal(persistence.unitDeleteCalls.length, 0);
  assert.equal(persistence.imageCreateCalls.length, 0);
  assert.equal(persistence.imageDeleteCalls.length, 0);
});

test("unit and image lifecycle operations synchronize availability and stay property-scoped", async () => {
  const persistence = installPropertyMocks(completeProperty);

  await addPropertyUnit("org-a", "property-a", { beds: 1, price: 900, available: true });
  await updatePropertyUnit("org-a", "property-a", "unit-a", { beds: 3, price: 1400, available: false });
  await deletePropertyUnit("org-a", "property-a", "unit-a");
  await addPropertyImage("org-a", "property-a", { url: " https://example.com/new.jpg ", altText: "New home" });
  await deletePropertyImage("org-a", "property-a", "image-a");

  assert.equal(persistence.unitCreateCalls.length, 1);
  assert.deepEqual(persistence.unitUpdateCalls[0], { where: { id: "unit-a", propertyId: "property-a" }, data: { beds: 3, price: 1400, available: false } });
  assert.deepEqual(persistence.unitDeleteCalls[0], { where: { id: "unit-a", propertyId: "property-a" } });
  assert.deepEqual(persistence.imageCreateCalls[0], { data: { propertyId: "property-a", url: "https://example.com/new.jpg", altText: "New home" } });
  assert.deepEqual(persistence.imageDeleteCalls[0], { where: { id: "image-a", propertyId: "property-a" } });
  assert.ok(persistence.availabilityUpdates.length >= 3);
  assert.ok(persistence.availabilityUpdates.every((call) =>
    (call as { data: { availabilityStatusSource?: string } }).data.availabilityStatusSource === "STAFF"
  ));
});

test("canonical readiness reports every incomplete condition and a fully ready property", async () => {
  const cases: Array<[string, TestProperty, boolean]> = [
    ["incomplete details", { ...completeProperty, title: "" }, false],
    ["missing units", { ...completeProperty, units: [] }, false],
    ["zero available units", { ...completeProperty, units: [{ ...completeProperty.units[0], available: false }] }, false],
    ["missing images", { ...completeProperty, images: [] }, false],
    ["unavailable status", { ...completeProperty, status: "UNAVAILABLE" }, false],
    ["unassigned organization", { ...completeProperty, organizationId: null }, false],
    ["fully ready", completeProperty, true]
  ];

  for (const [label, property, expected] of cases) {
    installPropertyMocks(property);
    const readiness = await getPropertyEntryReadiness("org-a", property.id);
    assert.equal(readiness.readyForProgramAssignment, expected, label);
  }
});

test("admin-created properties default to pending review", async () => {
  let createdData: Record<string, unknown> | undefined;
  prisma.property.create = (async ({ data }: { data: Record<string, unknown> }) => {
    createdData = data;
    return data;
  }) as unknown as typeof prisma.property.create;

  await createPropertyForOrganization("org-a", {
    title: "New home",
    description: "A new property",
    address: "1 Main Street",
    city: "Austin",
    state: "TX",
    rent: 1200,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 900
  });

  assert.equal(createdData?.publicationStatus, "PENDING_REVIEW");
  assert.equal(createdData?.publicationStatusSource, "AUTOMATIC");
  assert.equal(createdData?.availabilityStatusSource, "UNKNOWN");
});

test("admin-created available sale requires a positive sale price", async () => {
  let createCalls = 0;
  prisma.property.create = (async () => {
    createCalls++;
    return {};
  }) as unknown as typeof prisma.property.create;

  await assert.rejects(createPropertyForOrganization("org-a", {
    title: "New home",
    description: "A sale listing",
    address: "1 Main Street",
    city: "Austin",
    state: "TX",
    rent: 0,
    listingType: "For Sale",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 900,
    status: "AVAILABLE"
  }), /valid sale price/);
  assert.equal(createCalls, 0);
});

test("admin-created rentals cannot be available before a valid unit exists", async () => {
  let createCalls = 0;
  prisma.property.create = (async () => {
    createCalls++;
    return {};
  }) as unknown as typeof prisma.property.create;

  await assert.rejects(createPropertyForOrganization("org-a", {
    title: "New rental",
    description: "A rental listing",
    address: "1 Main Street",
    city: "Austin",
    state: "TX",
    rent: 1200,
    listingType: "For Rent",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 900,
    status: "AVAILABLE"
  }), /existing valid available unit/);
  assert.equal(createCalls, 0);
});

test("an admin publication decision is marked staff-managed", async () => {
  installPropertyMocks(completeProperty);
  let updateData: Record<string, unknown> | undefined;
  prisma.property.update = (async ({ data }: { data: Record<string, unknown> }) => {
    updateData = data;
    return data;
  }) as unknown as typeof prisma.property.update;

  await updatePropertyForOrganization("org-a", "property-a", { publicationStatus: "REJECTED" });

  assert.deepEqual(updateData, {
    publicationStatus: "REJECTED",
    publicationStatusSource: "STAFF"
  });
});

test("manual sale availability requires a valid sale price", async () => {
  const property = {
    ...completeProperty,
    listingType: "For Sale",
    salePrice: null
  };
  const persistence = installPropertyMocks(property);

  await assert.rejects(
    updatePropertyForOrganization("org-a", property.id, { status: "AVAILABLE" }),
    /valid sale price/
  );
  assert.equal(persistence.availabilityUpdates.length, 0);
});

test("sale price and availability editing do not require or create rental units", async () => {
  const property = {
    ...completeProperty,
    listingType: "For Sale",
    rent: 0,
    salePrice: 725000,
    units: []
  };
  const persistence = installPropertyMocks(property);

  await updatePropertyForOrganization("org-a", property.id, { salePrice: 735000, status: "AVAILABLE" });

  assert.deepEqual(
    (persistence.availabilityUpdates[0] as { data: Record<string, unknown> }).data,
    { salePrice: 735000, status: "AVAILABLE", availabilityStatusSource: "STAFF", availabilityCount: 0 }
  );
  assert.equal(persistence.unitCreateCalls.length, 0);
});

test("manual rental availability requires valid rent and an available unit", async () => {
  const property = {
    ...completeProperty,
    listingType: "For Rent",
    rent: 0,
    units: [{ ...completeProperty.units[0], price: 0 }]
  };
  const persistence = installPropertyMocks(property);

  await assert.rejects(
    updatePropertyForOrganization("org-a", property.id, { status: "AVAILABLE" }),
    /valid rental price and at least one valid available unit/
  );
  assert.equal(persistence.availabilityUpdates.length, 0);
});

test("manual availability rejects unknown listing categories", async () => {
  const property = { ...completeProperty, listingType: null };
  const persistence = installPropertyMocks(property);

  await assert.rejects(
    updatePropertyForOrganization("org-a", property.id, { status: "AVAILABLE" }),
    /recognized listing category/
  );
  assert.equal(persistence.availabilityUpdates.length, 0);
});

test("manual availability normalizes counts for valid sale and rental listings", async () => {
  let updateData: Record<string, unknown> | undefined;
  const sale = { ...completeProperty, listingType: "For Sale", salePrice: 325000 };
  installPropertyMocks(sale);
  prisma.property.update = (async ({ data }: { data: Record<string, unknown> }) => {
    updateData = data;
    return data;
  }) as unknown as typeof prisma.property.update;

  await updatePropertyForOrganization("org-a", sale.id, { status: "AVAILABLE", availabilityCount: 99 });
  assert.deepEqual(updateData, {
    status: "AVAILABLE",
    availabilityStatusSource: "STAFF",
    availabilityCount: 0
  });

  const rental = { ...completeProperty, listingType: "For Rent" };
  installPropertyMocks(rental);
  updateData = undefined;
  prisma.property.update = (async ({ data }: { data: Record<string, unknown> }) => {
    updateData = data;
    return data;
  }) as unknown as typeof prisma.property.update;

  await updatePropertyForOrganization("org-a", rental.id, { status: "AVAILABLE", availabilityCount: 99 });
  assert.deepEqual(updateData, {
    status: "AVAILABLE",
    availabilityStatusSource: "STAFF",
    availabilityCount: 1
  });
});

test("manual unavailable decisions are marked staff-managed", async () => {
  installPropertyMocks(completeProperty);
  let updateData: Record<string, unknown> | undefined;
  prisma.property.update = (async ({ data }: { data: Record<string, unknown> }) => {
    updateData = data;
    return data;
  }) as unknown as typeof prisma.property.update;

  await updatePropertyForOrganization("org-a", "property-a", { status: "UNAVAILABLE" });

  assert.deepEqual(updateData, {
    status: "UNAVAILABLE",
    availabilityStatusSource: "STAFF"
  });
});

test("admin availability source cannot be spoofed through the update API", async () => {
  const persistence = installPropertyMocks(completeProperty);
  await assert.rejects(
    updatePropertyForOrganization("org-a", "property-a", {
      status: "UNAVAILABLE",
      availabilityStatusSource: "AUTOMATIC"
    } as Parameters<typeof updatePropertyForOrganization>[2]),
    /cannot be set directly/
  );
  assert.equal(persistence.availabilityUpdates.length, 0);
});
