import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import {
  countPublicProperties,
  getPublicPropertyById,
  listPublicProperties,
  publicRentalListingWhere
} from "./public-property.service";

type PublicProperty = {
  id: string;
  organizationId: string | null;
  status: string;
  publicationStatus: string;
  rent: number;
  listingType: string | null;
  salePrice?: number | null;
  units: Array<{ id: string; available: boolean; beds?: number; price?: number }>;
  images: Array<{ id: string; url: string; altText: string | null }>;
};

const visibleRental: PublicProperty = {
  id: "property-visible",
  organizationId: "org-a",
  status: "AVAILABLE",
  publicationStatus: "PUBLISHED",
  rent: 1800,
  listingType: "For Rent",
  units: [{ id: "unit-1", available: true, beds: 2, price: 1800 }],
  images: []
};

const visibleSale: PublicProperty = {
  id: "sale-visible",
  organizationId: "org-a",
  status: "AVAILABLE",
  publicationStatus: "PUBLISHED",
  rent: 0,
  listingType: "For Sale",
  salePrice: 725000,
  units: [],
  images: []
};

const saleListingTypes = ["For Sale", "for_sale", "for-sale", "sale", "buy", "purchase"];
const rentalListingTypes = [
  "For Rent",
  "for_rent",
  "for-rent",
  "rent",
  "rental",
  "lease",
  "House for rent",
  "Apartment for rent",
  "Condo for rent",
  "Townhouse for rent",
  "Multi family home for rent",
  "Multi-family home for rent",
  "Home for rent",
  "Manufactured home for rent",
  "Mobile home for rent"
];

function installPublicMocks(properties: PublicProperty[]) {
  const findManyCalls: Array<{ where?: Record<string, unknown> }> = [];
  const findFirstCalls: Array<{ where?: Record<string, unknown>; include?: unknown }> = [];
  const countCalls: Array<{ where?: Record<string, unknown> }> = [];
  const visible = (property: PublicProperty, where: Record<string, unknown>) => {
    const subclauses = Array.isArray(where.OR) ? where.OR as Array<Record<string, unknown>> : [];
    const sale = "salePrice" in where || subclauses.some((clause) => "salePrice" in clause);
    const rent = "rent" in where || subclauses.some((clause) => "rent" in clause);
    const category = property.listingType?.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
    const isSale = ["for sale", "sale", "buy", "purchase"].includes(category ?? "");
    const isRent = rentalListingTypes.some((type) =>
      type.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ") === category
    );
    return property.organizationId !== null
      && property.publicationStatus === "PUBLISHED"
      && property.status === "AVAILABLE"
      && (sale && !rent
        ? isSale && (property.salePrice ?? 0) > 0
        : rent && !sale
          ? isRent && property.rent > 0 && property.units.some((unit) => unit.available && (unit.price ?? 0) > 0)
          : isSale
            ? (property.salePrice ?? 0) > 0
            : isRent && property.rent > 0 && property.units.some((unit) => unit.available && (unit.price ?? 0) > 0));
  };
  prisma.property.findMany = (async (args: { where?: Record<string, unknown> }) => {
    findManyCalls.push(args);
    return properties.filter((property) => visible(property, args.where ?? {}));
  }) as unknown as typeof prisma.property.findMany;
  prisma.property.findFirst = (async (args: { where?: Record<string, unknown>; include?: unknown }) => {
    findFirstCalls.push(args);
    return properties.find((property) => property.id === args.where?.id && visible(property, args.where ?? {})) ?? null;
  }) as unknown as typeof prisma.property.findFirst;
  prisma.property.count = (async (args: { where?: Record<string, unknown> }) => {
    countCalls.push(args);
    return properties.filter((property) => visible(property, args.where ?? {})).length;
  }) as unknown as typeof prisma.property.count;
  return { findFirstCalls, findManyCalls, countCalls };
}

const rentalWhere = {
  organizationId: { not: null },
  publicationStatus: "PUBLISHED",
  status: "AVAILABLE",
  rent: { gt: 0 },
  listingType: { in: rentalListingTypes, mode: "insensitive" },
  units: { some: { available: true, beds: { gte: 0 }, price: { gt: 0 } } }
};

test("homepage rental carousel uses the same strict rental-only eligibility filter", () => {
  assert.deepEqual(publicRentalListingWhere, rentalWhere);
});

test("public rental listing returns only published rentals and keeps default pagination", async () => {
  const persistence = installPublicMocks([visibleRental]);
  const result = await listPublicProperties();

  assert.deepEqual(result, [visibleRental]);
  assert.deepEqual(persistence.findManyCalls[0], {
    where: rentalWhere,
    include: {
      images: true,
      units: { where: { available: true, beds: { gte: 0 }, price: { gt: 0 } }, orderBy: [{ beds: "asc" }, { price: "asc" }] }
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
    skip: 0
  });
});

test("public rental discovery includes explicit Zillow rental category values", async () => {
  const rentals = rentalListingTypes.map((listingType, index) => ({
    ...visibleRental,
    id: `rental-category-${index}`,
    listingType
  }));
  installPublicMocks(rentals);

  assert.deepEqual(await listPublicProperties(), rentals);
});

test("public listing supports custom limit and offset", async () => {
  const persistence = installPublicMocks([visibleRental]);
  await listPublicProperties({ limit: 12, offset: 24 });

  assert.deepEqual(persistence.findManyCalls[0], {
    where: rentalWhere,
    include: {
      images: true,
      units: { where: { available: true, beds: { gte: 0 }, price: { gt: 0 } }, orderBy: [{ beds: "asc" }, { price: "asc" }] }
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
    skip: 24
  });
});

test("rental filters search location, overlapping rent ranges, bedrooms, and bathrooms", async () => {
  const persistence = installPublicMocks([visibleRental]);
  const filters = { location: " Austin ", minPrice: 2000, maxPrice: 3000, bedrooms: 2, bathrooms: 1 };

  await listPublicProperties({ listingType: "RENT", filters });
  assert.deepEqual(persistence.findManyCalls[0]?.where, {
    ...rentalWhere,
    AND: [
      {
        OR: [
          { address: { contains: "Austin", mode: "insensitive" } },
          { city: { contains: "Austin", mode: "insensitive" } },
          { state: { contains: "Austin", mode: "insensitive" } }
        ]
      },
      { OR: [{ rent: { gte: 2000 } }, { rentMax: { gte: 2000 } }] },
      { rent: { lte: 3000 } },
      { bedrooms: { gte: 2 } },
      { bathrooms: { gte: 1 } }
    ]
  });
  assert.equal(await countPublicProperties("RENT", filters), 1);
});

test("sale filters use sale price and never add rental units", async () => {
  const persistence = installPublicMocks([visibleSale]);

  await listPublicProperties({ listingType: "SALE", filters: { location: "Los Angeles", minPrice: 300000, maxPrice: 900000 } });
  assert.deepEqual(persistence.findManyCalls[0]?.where, {
    organizationId: { not: null },
    publicationStatus: "PUBLISHED",
    status: "AVAILABLE",
    salePrice: { gt: 0 },
    listingType: { in: saleListingTypes, mode: "insensitive" },
    AND: [
      {
        OR: [
          { address: { contains: "Los Angeles", mode: "insensitive" } },
          { city: { contains: "Los Angeles", mode: "insensitive" } },
          { state: { contains: "Los Angeles", mode: "insensitive" } }
        ]
      },
      { salePrice: { gte: 300000, lte: 900000 } }
    ]
  });
});

test("public count returns the total published rental count", async () => {
  const persistence = installPublicMocks([visibleRental]);

  assert.equal(await countPublicProperties(), 1);
  assert.deepEqual(persistence.countCalls[0], { where: rentalWhere });
});

test("public rental discovery excludes sales and every unpublished state", async () => {
  const disguisedSale = { ...visibleRental, id: "disguised-sale", listingType: "fOR_sAle" };
  installPublicMocks([
    visibleRental,
    visibleSale,
    disguisedSale,
    { ...visibleRental, id: "pending", publicationStatus: "PENDING_REVIEW" },
    { ...visibleRental, id: "approved-unpublished", publicationStatus: "APPROVED_UNPUBLISHED" },
    { ...visibleRental, id: "rejected", publicationStatus: "REJECTED" }
  ]);

  assert.deepEqual(await listPublicProperties(), [visibleRental]);
});

test("public rental discovery does not fabricate availability for incomplete rental information", async () => {
  const noPropertyRent = { ...visibleRental, id: "no-property-rent", rent: 0 };
  const noAvailableUnits = {
    ...visibleRental,
    id: "no-available-units",
    units: [{ id: "unavailable-unit", available: false, beds: 2, price: 1800 }]
  };
  const invalidUnitPrice = {
    ...visibleRental,
    id: "invalid-unit-price",
    units: [{ id: "zero-price-unit", available: true, beds: 2, price: 0 }]
  };

  installPublicMocks([noPropertyRent, noAvailableUnits, invalidUnitPrice]);

  assert.deepEqual(await listPublicProperties(), []);
});

test("public sale discovery requires publication, positive price, and available status but no units", async () => {
  const persistence = installPublicMocks([
    visibleRental,
    visibleSale,
    { ...visibleSale, id: "no-price", salePrice: 0 },
    { ...visibleSale, id: "unavailable", status: "UNAVAILABLE" },
    { ...visibleSale, id: "pending-sale", publicationStatus: "PENDING_REVIEW" }
  ]);

  assert.deepEqual(await listPublicProperties({ listingType: "SALE" }), [visibleSale]);
  assert.deepEqual(persistence.findManyCalls[0]?.where, {
    organizationId: { not: null },
    publicationStatus: "PUBLISHED",
    status: "AVAILABLE",
    salePrice: { gt: 0 },
    listingType: { in: saleListingTypes, mode: "insensitive" }
  });
  assert.deepEqual(await countPublicProperties("SALE"), 1);
});

test("unknown and unrecognized listing categories are excluded from both discovery routes", async () => {
  const migration = readFileSync(
    "prisma/migrations/20261105170000_add_property_publication_review/migration.sql",
    "utf8"
  );
  assert.match(migration, /SET "publicationStatus" = 'PUBLISHED'/);
  assert.match(migration, /property\."organizationId" IS NOT NULL/);
  assert.match(migration, /property\."status" = 'AVAILABLE'/);
  assert.match(migration, /property\."rent" > 0/);
  assert.match(migration, /property\."listingType" NOT IN \(/);
  assert.match(migration, /'Purchase', 'PURCHASE', 'purchase'/);
  assert.match(migration, /unit\."available" = TRUE/);

  const unknownCategory = { ...visibleRental, id: "unknown-category", listingType: null };
  installPublicMocks([unknownCategory]);

  assert.deepEqual(await listPublicProperties(), []);
  assert.deepEqual(await listPublicProperties({ listingType: "SALE" }), []);
});

test("public detail lookup recognizes published sale listings and excludes hidden listings", async () => {
  const persistence = installPublicMocks([
    visibleRental,
    visibleSale,
    { ...visibleRental, id: "pending", publicationStatus: "PENDING_REVIEW" },
    { ...visibleRental, id: "unavailable", status: "UNAVAILABLE" },
    { ...visibleRental, id: "unowned", organizationId: null }
  ]);

  assert.deepEqual(await getPublicPropertyById("pending"), null);
  assert.deepEqual(await getPublicPropertyById("unavailable"), null);
  assert.deepEqual(await getPublicPropertyById("unowned"), null);
  assert.deepEqual(await getPublicPropertyById("sale-visible"), visibleSale);
  assert.deepEqual(await getPublicPropertyById("sale-visible", "SALE"), visibleSale);
  assert.equal(persistence.findFirstCalls.length, 5);
  assert.deepEqual(persistence.findFirstCalls[0]?.include, {
    images: true,
    units: { where: { available: true, beds: { gte: 0 }, price: { gt: 0 } }, orderBy: [{ beds: "asc" }, { price: "asc" }] }
  });
});
