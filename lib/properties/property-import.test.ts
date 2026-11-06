import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import { importProperties, normalizeZillowListing } from "./property-import.service";

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
  prisma.property.findFirst = (async () => existing ? { ...existing, sourceName: null, sourceMetadata: null, images: [], units: [] } : null) as unknown as typeof prisma.property.findFirst;
  prisma.property.findUnique = (async () => existing) as unknown as typeof prisma.property.findUnique;
}

function installExistingZillowProperty(options: {
  listing: Record<string, unknown>;
  managedImageUrls?: string[];
  managedUnitIds?: Record<string, string>;
  images?: Array<{ id: string; url: string; altText: string | null }>;
  units?: Array<{ id: string; beds: number; price: number; available: boolean }>;
  publicationStatus?: string;
  publicationStatusSource?: string;
}) {
  const originalFindFirst = prisma.property.findFirst;
  const originalFindUnique = prisma.property.findUnique;
  const originalTransaction = prisma.$transaction;
  const isRentalListing = String(options.listing.listing_type).toLowerCase().includes("rent");
  const property = {
    id: "zillow-property-1",
    externalId: `zillow:${options.listing.property_id}`,
    organizationId: "org-a",
    sourceName: "Zillow",
    listingType: isRentalListing ? "For Rent" : "For Sale",
    salePrice: isRentalListing ? null : Number(options.listing.price),
    sourceUrl: typeof options.listing.property_url === "string" ? options.listing.property_url : null,
    sourceStatus: [options.listing.status, options.listing.status_text].filter((value) => typeof value === "string").join(" | ") || null,
    sourceMetadata: {
      sourceListing: options.listing,
      importReview: { required: false, reasons: [] },
      importedImageUrls: options.managedImageUrls ?? [],
      legacyUnitOwnershipUnverified: false,
      ...(options.managedUnitIds ? { importedUnitIds: options.managedUnitIds } : {})
    },
    title: typeof options.listing.property_name === "string" ? options.listing.property_name : `Zillow listing ${options.listing.property_id}`,
    description: typeof options.listing.description === "string" ? options.listing.description : "Imported Zillow property listing.",
    address: typeof options.listing.address === "string" ? options.listing.address : "123 Example Avenue",
    city: typeof options.listing.city === "string" ? options.listing.city : "Los Angeles",
    state: typeof options.listing.state === "string" ? options.listing.state : "CA",
    zip: typeof options.listing.zip === "string" ? options.listing.zip : null,
    latitude: typeof options.listing.latitude === "number" ? options.listing.latitude : null,
    longitude: typeof options.listing.longitude === "number" ? options.listing.longitude : null,
    rent: isRentalListing ? Number(options.listing.price) : 0,
    rentMax: 1900,
    bedrooms: typeof options.listing.bedrooms === "number" ? options.listing.bedrooms : 0,
    bathrooms: typeof options.listing.bathrooms === "number" ? options.listing.bathrooms : 1,
    sqft: typeof options.listing.living_area === "number" ? options.listing.living_area : 0,
    amenities: ["HELOCI managed amenity"],
    specialOffers: ["Internal offer"],
    availabilityCount: isRentalListing && Array.isArray(options.listing.units) ? options.listing.units.filter((unit) => typeof unit === "object" && unit !== null && "isAvailable" in unit && unit.isAvailable === true).length : 0,
    status: isRentalListing
      ? Array.isArray(options.listing.units) && options.listing.units.some((unit) => typeof unit === "object" && unit !== null && "isAvailable" in unit && unit.isAvailable === true) ? "AVAILABLE" : "UNAVAILABLE"
      : options.listing.status_text === "Active" ? "AVAILABLE" : "UNAVAILABLE",
    publicationStatus: options.publicationStatus ?? "PUBLISHED",
    publicationStatusSource: options.publicationStatusSource ?? "AUTOMATIC",
    images: options.images ?? [],
    units: options.units ?? [],
    programProperties: [{ id: "program-assignment-1" }],
    applications: [{ id: "application-1" }],
    staffNotes: [{ id: "staff-note-1" }]
  };
  const transaction = {
    $queryRaw: async () => [],
    property: {
      findFirst: async () => ({ id: property.id }),
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const matches = where.id === property.id && where.organizationId === property.organizationId && where.sourceName === property.sourceName;
        if (matches) Object.assign(property, data);
        return { count: matches ? 1 : 0 };
      }
    },
    propertyImage: {
      findMany: async () => property.images,
      create: async ({ data }: { data: { propertyId: string; url: string; altText: string | null } }) => {
        const created = { id: `image-${property.images.length + 1}`, url: data.url, altText: data.altText };
        property.images.push(created);
        return created;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const index = property.images.findIndex((image) => image.id === where.id);
        if (index >= 0) property.images.splice(index, 1);
        return {};
      },
      update: async ({ where, data }: { where: { id: string }; data: { altText?: string | null } }) => {
        const image = property.images.find((candidate) => candidate.id === where.id);
        if (image) Object.assign(image, data);
        return image;
      }
    },
    propertyUnit: {
      findMany: async () => property.units,
      create: async ({ data }: { data: { propertyId: string; beds: number; price: number; available: boolean } }) => {
        const created = { id: `unit-${property.units.length + 1}`, beds: data.beds, price: data.price, available: data.available };
        property.units.push(created);
        return created;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const unit = property.units.find((candidate) => candidate.id === where.id);
        if (unit) Object.assign(unit, data);
        return unit;
      }
    }
  };

  prisma.property.findFirst = (async ({ where }: { where: { externalId?: string; organizationId?: string } }) => {
    return where.externalId === property.externalId && where.organizationId === property.organizationId ? property : null;
  }) as unknown as typeof prisma.property.findFirst;
  prisma.property.findUnique = (async () => ({ id: property.id, organizationId: property.organizationId, sourceName: property.sourceName, sourceMetadata: property.sourceMetadata })) as unknown as typeof prisma.property.findUnique;
  (prisma as unknown as { $transaction: (callback: (tx: typeof transaction) => Promise<unknown>) => Promise<unknown> }).$transaction = (callback) => callback(transaction);

  return {
    property,
    restore() {
      prisma.property.findFirst = originalFindFirst;
      prisma.property.findUnique = originalFindUnique;
      prisma.$transaction = originalTransaction;
    }
  };
}

test("dry-run normalizes nullable fields, reports warnings, and does not write", async () => {
  mockPropertyLookup(null);
  const result = await importProperties({ dryRun: true, properties: [validProperty] }, { organizationId: "org-a" });

  assert.equal(result.status, "DRY_RUN");
  assert.deepEqual(result.summary, { received: 1, created: 1, updated: 0, skipped: 0, failed: 0 });
  assert.equal(result.results[0].status, "CREATED");
  assert.ok(result.results[0].warnings.some((warning) => warning.includes("schema-required placeholder 0")));
  assert.ok(result.results[0].warnings.some((warning) => warning.includes("availabilityCount")));
  assert.deepEqual(result.warnings, result.results[0].warnings.map((warning) => `${validProperty.externalId}: ${warning}`));
  assert.deepEqual(result.errors, []);
});

test("normalizes a Zillow House for sale listing to available with the sale price", () => {
  const normalized = normalizeZillowListing({
    property_id: "52410627",
    listing_type: "For Sale",
    price: "$449,900",
    address: "3019 Brook Shore Ct, Kingwood, TX 77345",
    property_name: "3019 Brook Shore Ct",
    bedrooms: 4,
    bathrooms: 4,
    property_url: "https://www.zillow.com/homedetails/3019-Brook-Shore-Ct-Kingwood-TX-77345/52410627_zpid/",
    image_url: "https://photos.zillowstatic.com/fp/3c828e05c24e20dd38a962cda4d04424-p_e.jpg",
    image_urls: ["https://photos.zillowstatic.com/fp/3c828e05c24e20dd38a962cda4d04424-p_e.jpg"],
    description: "",
    status: "House for sale",
    status_text: "House for sale",
    city: "Kingwood",
    state: "TX",
    zip: "77345",
    property_type: "SINGLE_FAMILY",
    home_type: "SINGLE_FAMILY",
    living_area: 3295,
    details_summary: "4 bed, 4 bath, 3295 sq ft | SINGLE_FAMILY | House for sale",
    property_details: {
      status_text: "House for sale",
      status: "House for sale",
      marketing_status: "FOR_SALE"
    },
    marketing_status: "FOR_SALE"
  });

  assert.equal(normalized.listingType, "For Sale");
  assert.equal(normalized.status, "AVAILABLE");
  assert.equal(normalized.salePrice, 449900);
});

test("sale normalization rejects inactive statuses and reviews unknown or conflicting statuses", () => {
  const base = {
    property_id: "sale-status",
    listing_type: "For Sale",
    price: "$449,900",
    status: "House for sale",
    status_text: "House for sale"
  };
  for (const status of ["Sold", "Pending", "Under contract", "Withdrawn", "Off market", "Delisted", "Expired"]) {
    const normalized = normalizeZillowListing({ ...base, status_text: status });
    assert.equal(normalized.status, "UNAVAILABLE", status);
    assert.ok(normalized.sourceMetadata.importReview.reasons.includes("source_listing_inactive"), status);
  }
  const unknown = normalizeZillowListing({ ...base, status_text: "Coming soon maybe" });
  assert.equal(unknown.status, "UNAVAILABLE");
  assert.ok(unknown.sourceMetadata.importReview.reasons.includes("source_availability_uncertain"));

  const conflicting = normalizeZillowListing({ ...base, status_text: "Sold", marketing_status: "FOR_SALE" });
  assert.equal(conflicting.status, "UNAVAILABLE");
  assert.ok(conflicting.sourceMetadata.importReview.reasons.includes("source_listing_inactive"));
});

test("non-array payload errors are top-level and have no row results", async () => {
  const result = await importProperties({ properties: "not-an-array" }, { organizationId: "org-a" });

  assert.deepEqual(result.summary, { received: 0, created: 0, updated: 0, skipped: 0, failed: 0 });
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(result.errors, ["properties must be an array"]);
  assert.deepEqual(result.results, []);
});

test("duplicate external IDs import only the first row", async () => {
  const result = await importProperties([validProperty, { ...validProperty, title: "Duplicate" }], { organizationId: "org-a", dryRun: true });

  assert.equal(result.summary.created, 1);
  assert.equal(result.summary.skipped, 1);
  assert.equal(result.results[0].status, "CREATED");
  assert.equal(result.results[1].status, "SKIPPED");
  assert.equal(result.results[1].errors[0], "Duplicate externalId in this import");
  assert.equal(result.results[0].review?.decision, "PENDING_REVIEW");
  assert.ok(result.results[0].review?.reasons.includes("duplicate_external_id_in_import"));
});

const losAngelesSale = {
  property_id: "la-zillow-1001",
  property_name: "Los Angeles Craftsman",
  listing_type: "For Sale",
  price: 725000,
  address: "123 Example Avenue",
  city: "Los Angeles",
  state: "CA",
  zip: "90026",
  bedrooms: 3,
  bathrooms: 2,
  property_type: "Single Family",
  home_type: "HOUSE",
  living_area: 1480,
  lot_area: 5200,
  lot_area_unit: "sqft",
  image_url: "https://images.example.test/la-home.jpg",
  image_urls: ["https://images.example.test/la-home.jpg", "https://images.example.test/la-kitchen.jpg"],
  description: "A Los Angeles home listing.",
  status: "FOR_SALE",
  status_text: "Active",
  property_url: "https://www.zillow.com/homedetails/la-zillow-1001/",
  broker_name: "Example Realty",
  zestimate: 740000,
  rent_zestimate: 3500,
  tax_assessed_value: 680000,
  latitude: 34.077,
  longitude: -118.26,
  details_summary: "Three-bedroom Craftsman.",
  property_details: { year_built: 1925 },
  tlocal_image: "https://images.example.test/la-exterior.jpg"
};

test("normalizes and stores the Los Angeles Zillow sale without treating its price as rent", async () => {
  const normalized = normalizeZillowListing(losAngelesSale);

  assert.equal(normalized.externalId, "zillow:la-zillow-1001");
  assert.equal(normalized.city, "Los Angeles");
  assert.equal(normalized.listingType, "For Sale");
  assert.equal(normalized.salePrice, 725000);
  assert.equal(normalized.rent, 0);
  assert.equal(normalized.status, "AVAILABLE");
  assert.equal(normalized.sourceName, "Zillow");
  assert.equal(normalized.sourceUrl, losAngelesSale.property_url);
  assert.equal(normalized.images.length, 3);
  assert.equal(normalized.units.length, 0);
  assert.equal(normalized.sourceMetadata.sourceListing.rent_zestimate, 3500);
  assert.deepEqual(normalized.sourceMetadata.sourceListing.property_details, { year_built: 1925 });
  assert.equal(normalized.sourceMetadata.importReview.required, false);

  mockPropertyLookup(null);
  let createdProperty: { data: Record<string, unknown> } | undefined;
  const createdImages: unknown[] = [];
  const transaction = {
    property: {
      create: async (args: { data: Record<string, unknown> }) => {
        createdProperty = args;
        return { id: "la-sale-property" };
      },
      update: async () => ({ id: "la-sale-property" })
    },
    propertyUnit: {
      findMany: async () => [],
      create: async () => ({})
    },
    propertyImage: {
      findFirst: async () => null,
      create: async (args: { data: unknown }) => {
        createdImages.push(args.data);
        return args.data;
      },
      update: async () => ({})
    }
  };
  (prisma as unknown as { $transaction: (callback: (tx: typeof transaction) => Promise<unknown>) => Promise<unknown> }).$transaction = (callback) => callback(transaction);

  const result = await importProperties([losAngelesSale], { organizationId: "org-la" });

  assert.equal(result.summary.created, 1);
  assert.equal(createdProperty?.data.salePrice, 725000);
  assert.equal(createdProperty?.data.rent, 0);
  assert.equal(createdProperty?.data.listingType, "For Sale");
  assert.equal(createdProperty?.data.status, "AVAILABLE");
  assert.equal(createdProperty?.data.publicationStatus, "PUBLISHED");
  assert.equal(createdProperty?.data.sourceStatus, "FOR_SALE | Active");
  assert.deepEqual((createdProperty?.data.sourceMetadata as { sourceListing: unknown }).sourceListing, losAngelesSale);
  assert.equal(createdProperty?.data.organizationId, "org-la");
  assert.equal(createdProperty?.data.sourceUrl, losAngelesSale.property_url);
  assert.equal(createdImages.length, 3);
});

test("missing rental and sale prices enter manual review rather than failing the import", async () => {
  const rental = {
    ...losAngelesSale,
    property_id: "missing-rental-price",
    listing_type: "For Rent",
    price: undefined,
    status: "FOR_RENT",
    units: [{ bedrooms: 2, rent: 2400, isAvailable: true }]
  };
  const sale = { ...losAngelesSale, property_id: "missing-sale-price", price: undefined };

  const rentalResult = await importProperties([rental], { organizationId: "org-a", dryRun: true });
  const saleResult = await importProperties([sale], { organizationId: "org-a", dryRun: true });

  assert.equal(rentalResult.summary.failed, 0);
  assert.equal(rentalResult.results[0].review?.decision, "PENDING_REVIEW");
  assert.ok(rentalResult.results[0].review?.reasons.includes("rental_price_missing_or_invalid"));
  assert.equal(saleResult.summary.failed, 0);
  assert.equal(saleResult.results[0].review?.decision, "PENDING_REVIEW");
  assert.ok(saleResult.results[0].review?.reasons.includes("sale_price_missing_or_invalid"));

  const missingAddress = await importProperties([{
    ...losAngelesSale,
    property_id: "missing-address",
    address: ""
  }], { organizationId: "org-a", dryRun: true });
  assert.equal(missingAddress.summary.failed, 0);
  assert.equal(missingAddress.results[0].review?.decision, "PENDING_REVIEW");
  assert.ok(missingAddress.results[0].review?.reasons.includes("address_incomplete"));
});

test("updates an existing same-organization Zillow property and reports its ID and changes", async () => {
  const fixture = installExistingZillowProperty({ listing: losAngelesSale });
  const incoming = { ...losAngelesSale, property_name: "Updated Craftsman", property_type: "Condo", home_type: "APARTMENT", lot_area: 6100, price: 799000 };

  try {
    const result = await importProperties([incoming], { organizationId: "org-a" });

    assert.equal(result.summary.updated, 1);
    assert.equal(result.results[0].status, "UPDATED");
    assert.equal(result.results[0].propertyId, fixture.property.id);
    assert.ok(result.results[0].changes?.includes("price"));
    assert.ok(result.results[0].changes?.includes("title"));
    assert.equal(fixture.property.salePrice, 799000);
    assert.equal(fixture.property.status, "AVAILABLE");
    assert.equal(fixture.property.title, "Updated Craftsman");
    assert.equal((fixture.property.sourceMetadata as { sourceListing: Record<string, unknown> }).sourceListing.property_type, "Condo");
    assert.equal((fixture.property.sourceMetadata as { sourceListing: Record<string, unknown> }).sourceListing.home_type, "APARTMENT");
    assert.equal((fixture.property.sourceMetadata as { sourceListing: Record<string, unknown> }).sourceListing.lot_area, 6100);
    assert.equal(fixture.property.organizationId, "org-a");
    assert.deepEqual(fixture.property.programProperties, [{ id: "program-assignment-1" }]);
    assert.deepEqual(fixture.property.applications, [{ id: "application-1" }]);
    assert.deepEqual(fixture.property.staffNotes, [{ id: "staff-note-1" }]);
  } finally {
    fixture.restore();
  }
});

test("concurrent duplicate Zillow creates resolve to the organization-scoped property", async () => {
  const fixture = installExistingZillowProperty({ listing: losAngelesSale });
  const existingTransaction = prisma.$transaction;
  let scopedLookups = 0;
  let transactions = 0;
  prisma.property.findFirst = (async () => {
    scopedLookups++;
    return scopedLookups === 1 ? null : fixture.property;
  }) as unknown as typeof prisma.property.findFirst;
  prisma.property.findUnique = (async () => null) as unknown as typeof prisma.property.findUnique;
  (prisma as unknown as { $transaction: (callback: (tx: unknown) => Promise<unknown>) => Promise<unknown> }).$transaction = async (callback) => {
    transactions++;
    if (transactions === 1) throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    return existingTransaction(callback as never);
  };

  try {
    const result = await importProperties([losAngelesSale], { organizationId: "org-a" });
    assert.equal(transactions, 2);
    assert.equal(result.summary.created, 0);
    assert.equal(result.summary.failed, 0);
    assert.equal(result.results[0].propertyId, fixture.property.id);
    assert.ok(["UPDATED", "SKIPPED"].includes(result.results[0].status));
    assert.equal(fixture.property.externalId, "zillow:la-zillow-1001");
  } finally {
    fixture.restore();
  }
});

test("preserves omitted optional fields and does not clear required fields on explicit null", async () => {
  const fixture = installExistingZillowProperty({ listing: losAngelesSale });
  const { property_name, description, address, city, state, zip, bedrooms, bathrooms, living_area, property_url, latitude, longitude, ...partialListing } = losAngelesSale;

  try {
    await importProperties([{ ...partialListing, price: 740000 }], { organizationId: "org-a" });
    assert.equal(fixture.property.title, losAngelesSale.property_name);
    assert.equal(fixture.property.description, losAngelesSale.description);
    assert.equal(fixture.property.address, "123 Example Avenue");
    assert.equal(fixture.property.city, "Los Angeles");
    assert.equal(fixture.property.state, "CA");
    assert.equal(fixture.property.zip, "90026");
    assert.equal(fixture.property.bedrooms, 3);
    assert.equal(fixture.property.bathrooms, 2);
    assert.equal(fixture.property.sqft, 1480);
    assert.equal(fixture.property.sourceUrl, losAngelesSale.property_url);
    assert.equal(fixture.property.latitude, 34.077);
    assert.equal(fixture.property.longitude, -118.26);

    const cleared = await importProperties([{
      ...losAngelesSale,
      price: 741000,
      address: null,
      city: null,
      state: null,
      zip: null,
      bedrooms: null,
      bathrooms: null,
      living_area: null,
      property_url: null,
      latitude: null
    }], { organizationId: "org-a" });

    assert.equal(cleared.summary.updated, 1);
    assert.equal(fixture.property.zip, null);
    assert.equal(fixture.property.sourceUrl, null);
    assert.equal(fixture.property.latitude, null);
    assert.equal(fixture.property.address, losAngelesSale.address);
    assert.equal(fixture.property.city, losAngelesSale.city);
    assert.equal(fixture.property.state, losAngelesSale.state);
    assert.equal(fixture.property.bedrooms, 3);
    assert.equal(fixture.property.bathrooms, 2);
    assert.equal(fixture.property.sqft, 1480);
    assert.deepEqual(fixture.property.programProperties, [{ id: "program-assignment-1" }]);
    assert.deepEqual(fixture.property.applications, [{ id: "application-1" }]);
    assert.deepEqual(fixture.property.staffNotes, [{ id: "staff-note-1" }]);
  } finally {
    fixture.restore();
  }
});

test("refreshes Zillow images, preserves manual images, and remains duplicate-free on repeats", async () => {
  const oldImage = "https://images.example.test/old.jpg";
  const manualImage = "https://internal.example.test/manual.jpg";
  const newImage = "https://images.example.test/new.jpg";
  const listing = { ...losAngelesSale, image_url: oldImage, image_urls: [], tlocal_image: null };
  const fixture = installExistingZillowProperty({
    listing,
    managedImageUrls: [oldImage],
    images: [
      { id: "image-old", url: oldImage, altText: "Old Zillow image" },
      { id: "image-manual", url: manualImage, altText: "Manual image" }
    ]
  });

  try {
    const incoming = { ...listing, image_url: newImage, price: 730000 };
    const first = await importProperties([incoming], { organizationId: "org-a" });
    assert.equal(first.summary.updated, 1);
    assert.deepEqual(fixture.property.images.map((image) => image.url).sort(), [manualImage, newImage].sort());

    const repeat = await importProperties([incoming], { organizationId: "org-a" });
    assert.equal(repeat.summary.skipped, 1);
    assert.equal(fixture.property.images.filter((image) => image.url === newImage).length, 1);
    assert.ok(fixture.property.images.some((image) => image.url === manualImage));
  } finally {
    fixture.restore();
  }
});

test("repeat imports preserve staff rejection and unpublished decisions", async () => {
  const activeSale = {
    ...losAngelesSale,
    status: "House for sale",
    status_text: "House for sale",
    marketing_status: "FOR_SALE"
  };
  for (const publicationStatus of ["REJECTED", "APPROVED_UNPUBLISHED"]) {
    const fixture = installExistingZillowProperty({
      listing: activeSale,
      publicationStatus,
      publicationStatusSource: "STAFF"
    });

    try {
      const result = await importProperties([{
        ...activeSale,
        property_name: `${publicationStatus} remains`
      }], { organizationId: "org-a" });

      assert.equal(result.results[0].review?.decision, publicationStatus);
      assert.equal(fixture.property.publicationStatus, publicationStatus);
      assert.equal(fixture.property.publicationStatusSource, "STAFF");
    } finally {
      fixture.restore();
    }
  }
});

test("sale-to-rent transition creates managed units and recalculates availability", async () => {
  const fixture = installExistingZillowProperty({ listing: losAngelesSale });
  const rental = {
    ...losAngelesSale,
    listing_type: "For Rent",
    price: 2500,
    status: "FOR_RENT",
    units: [{ externalId: "unit-1", bedrooms: 2, bathrooms: 1, rent: 2500, sqft: 900, isAvailable: true }]
  };

  try {
    const result = await importProperties([rental], { organizationId: "org-a" });
    assert.equal(result.summary.updated, 1);
    assert.equal(fixture.property.listingType, "For Rent");
    assert.equal(fixture.property.rent, 2500);
    assert.equal(fixture.property.salePrice, null);
    assert.equal(fixture.property.status, "AVAILABLE");
    assert.equal(fixture.property.availabilityCount, 1);
    assert.deepEqual(fixture.property.units.map(({ beds, price, available }) => ({ beds, price, available })), [{ beds: 2, price: 2500, available: true }]);
  } finally {
    fixture.restore();
  }
});

test("sale-to-rent transition without valid units remains unavailable", async () => {
  const fixture = installExistingZillowProperty({ listing: losAngelesSale });
  const rental = { ...losAngelesSale, listing_type: "For Rent", price: 2500, status: "FOR_RENT" };

  try {
    const result = await importProperties([rental], { organizationId: "org-a" });
    assert.equal(result.summary.updated, 1);
    assert.equal(fixture.property.status, "UNAVAILABLE");
    assert.equal(fixture.property.availabilityCount, 0);
    assert.equal(fixture.property.units.length, 0);
  } finally {
    fixture.restore();
  }
});

test("rent-to-sale transition disables managed units and uses explicit sale availability", async () => {
  const rental = {
    ...losAngelesSale,
    listing_type: "For Rent",
    price: 2500,
    status: "FOR_RENT",
    units: [{ externalId: "unit-1", bedrooms: 2, bathrooms: 1, rent: 2500, sqft: 900, isAvailable: true }]
  };
  const fixture = installExistingZillowProperty({
    listing: rental,
    managedUnitIds: { "external:unit-1": "unit-1-db" },
    units: [{ id: "unit-1-db", beds: 2, price: 2500, available: true }]
  });

  try {
    const result = await importProperties([losAngelesSale], { organizationId: "org-a" });
    assert.equal(result.summary.updated, 1);
    assert.equal(fixture.property.listingType, "For Sale");
    assert.equal(fixture.property.rent, 0);
    assert.equal(fixture.property.salePrice, 725000);
    assert.equal(fixture.property.status, "AVAILABLE");
    assert.equal(fixture.property.availabilityCount, 0);
    assert.equal(fixture.property.units[0].available, false);
  } finally {
    fixture.restore();
  }
});

test("rent-to-sale transition preserves ambiguous legacy units and reports a warning", async () => {
  const rental = {
    ...losAngelesSale,
    listing_type: "For Rent",
    price: 2500,
    status: "FOR_RENT",
    units: [{ externalId: "unit-legacy", bedrooms: 2, bathrooms: 1, rent: 2500, sqft: 900, isAvailable: true }]
  };
  const fixture = installExistingZillowProperty({
    listing: rental,
    units: [{ id: "legacy-unit-db", beds: 2, price: 2500, available: true }]
  });

  try {
    const result = await importProperties([losAngelesSale], { organizationId: "org-a" });
    assert.equal(result.summary.updated, 1);
    assert.equal(fixture.property.units[0].available, true);
    assert.equal(result.results[0].warnings.some((warning) => warning.includes("could not be confidently attributed")), true);
    assert.equal(fixture.property.sourceMetadata.legacyUnitOwnershipUnverified, true);
  } finally {
    fixture.restore();
  }
});

test("legacy rental with ambiguous units remains unavailable during update", async () => {
  const rental = {
    ...losAngelesSale,
    listing_type: "For Rent",
    price: 2500,
    status: "FOR_RENT",
    units: [{ externalId: "new-unit", bedrooms: 2, bathrooms: 1, rent: 2500, sqft: 900, isAvailable: true }]
  };
  const fixture = installExistingZillowProperty({
    listing: rental,
    units: [{ id: "manual-unit", beds: 2, price: 2500, available: true }]
  });

  try {
    const result = await importProperties([rental], { organizationId: "org-a" });
    assert.equal(result.summary.updated, 1);
    assert.equal(fixture.property.units[0].available, true);
    assert.equal(fixture.property.status, "UNAVAILABLE");
    assert.equal(fixture.property.availabilityCount, 0);
    assert.equal(result.results[0].warnings.some((warning) => warning.includes("existing units were preserved")), true);
  } finally {
    fixture.restore();
  }
});

test("invalid properties produce a failure without database lookup", async () => {
  const result = await importProperties([{ externalId: "bad", title: "" }], { organizationId: "org-a", dryRun: true });

  assert.equal(result.summary.failed, 1);
  assert.equal(result.results[0].status, "FAILED");
  assert.ok(result.results[0].errors.some((error) => error.includes("description")));
});

test("missing bedrooms use a review-marked placeholder and remain unavailable", () => {
  const normalized = normalizeZillowListing({
    ...losAngelesSale,
    property_id: "missing-bedroom-rental",
    listing_type: "For Rent",
    price: 2400,
    bedrooms: undefined
  });

  assert.equal(normalized.bedrooms, 0);
  assert.equal(normalized.status, "UNAVAILABLE");
  assert.equal(normalized.availabilityCount, 0);
  assert.equal(normalized.units.length, 0);
  assert.equal(normalized.sourceMetadata.importReview.required, true);
  assert.ok(normalized.sourceMetadata.importReview.reasons.includes("bedrooms_missing"));
  assert.ok(normalized.importWarnings.some((warning) => warning.includes("bedrooms was missing")));
});

test("multi-unit rentals do not synthesize units but accept explicit unit data", () => {
  const listing = {
    ...losAngelesSale,
    property_id: "multi-unit-rental",
    listing_type: "For Rent",
    price: 2400,
    property_type: "Multi Family"
  };
  const withoutUnits = normalizeZillowListing(listing);

  assert.deepEqual(withoutUnits.units, []);
  assert.equal(withoutUnits.status, "UNAVAILABLE");
  assert.equal(withoutUnits.availabilityCount, 0);
  assert.ok(withoutUnits.sourceMetadata.importReview.reasons.includes("multi_unit_requires_unit_data"));
  assert.ok(withoutUnits.importWarnings.some((warning) => warning.includes("No unit-level data was supplied")));

  const withUnit = normalizeZillowListing({
    ...listing,
    units: [{ externalId: "unit-1", bedrooms: 2, bathrooms: 1, rent: 2400, sqft: 900, isAvailable: true }]
  });
  assert.equal(withUnit.units.length, 1);
  assert.equal(withUnit.availabilityCount, 1);
  assert.equal(withUnit.status, "AVAILABLE");
});

test("existing Zillow external ID in another organization is rejected before persistence", async () => {
  let lookupArgs: unknown;
  prisma.property.findFirst = (async (args: unknown) => {
    lookupArgs = args;
    return null;
  }) as unknown as typeof prisma.property.findFirst;
  prisma.property.findUnique = (async () => ({ id: "property-1", organizationId: "org-b", sourceName: "Zillow", sourceMetadata: { sourceListing: losAngelesSale } })) as unknown as typeof prisma.property.findUnique;
  let transactionCount = 0;
  const originalTransaction = prisma.$transaction;
  (prisma as unknown as { $transaction: () => Promise<never> }).$transaction = async () => {
    transactionCount++;
    throw new Error("A foreign-organization property must not be written");
  };

  try {
    const result = await importProperties([losAngelesSale], { organizationId: "org-a" });

    assert.deepEqual(lookupArgs, {
      where: { externalId: "zillow:la-zillow-1001", organizationId: "org-a" },
      include: { images: true, units: true }
    });
    assert.equal(result.summary.failed, 1);
    assert.equal(result.results[0].errors[0], "Property belongs to another organization");
    assert.equal(result.results[0].externalId, "zillow:la-zillow-1001");
    assert.equal(transactionCount, 0);
  } finally {
    prisma.$transaction = originalTransaction;
  }
});

test("a cross-organization unique conflict after lookup fails without updating either property", async () => {
  let lookupCount = 0;
  prisma.property.findUnique = (async () => {
    lookupCount++;
    return lookupCount === 1 ? null : { id: "property-other-org", organizationId: "org-b" };
  }) as unknown as typeof prisma.property.findUnique;
  prisma.property.findFirst = (async () => null) as unknown as typeof prisma.property.findFirst;
  let transactionCount = 0;
  (prisma as unknown as { $transaction: () => Promise<never> }).$transaction = async () => {
    transactionCount++;
    throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
  };

  const result = await importProperties([validProperty], { organizationId: "org-a" });

  assert.equal(transactionCount, 1);
  assert.equal(result.summary.failed, 1);
  assert.equal(result.results[0].status, "FAILED");
  assert.equal(result.results[0].errors[0], "Property belongs to another organization");
});

test("a same-organization unique conflict is skipped without updating the existing property", async () => {
  let lookupCount = 0;
  prisma.property.findUnique = (async () => {
    lookupCount++;
    return lookupCount === 1 ? null : { id: "property-same-org", organizationId: "org-a" };
  }) as unknown as typeof prisma.property.findUnique;
  let scopedLookupCount = 0;
  prisma.property.findFirst = (async () => {
    scopedLookupCount++;
    return scopedLookupCount === 1 ? null : { id: "property-same-org", organizationId: "org-a", sourceName: "Housing", sourceMetadata: null, images: [], units: [] };
  }) as unknown as typeof prisma.property.findFirst;
  (prisma as unknown as { $transaction: () => Promise<never> }).$transaction = async () => {
    throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
  };

  const result = await importProperties([validProperty], { organizationId: "org-a" });

  assert.equal(result.summary.skipped, 1);
  assert.equal(result.results[0].status, "SKIPPED");
  assert.match(result.results[0].errors[0], /existing property was not changed/);
});

test("existing property in the same organization is skipped without overwrite", async () => {
  mockPropertyLookup({ id: "property-1", organizationId: "org-a" });
  const result = await importProperties({ properties: [validProperty], dryRun: true }, { organizationId: "org-a" });

  assert.equal(result.summary.skipped, 1);
  assert.equal(result.results[0].status, "SKIPPED");
  assert.match(result.results[0].errors[0], /existing property was not changed/);
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

test("bulk Zillow import reviews duplicates, publishes clean rentals, and keeps sale price separate", async () => {
  mockPropertyLookup(null);
  const propertyCreates: Array<{ data: Record<string, unknown> }> = [];
  const unitCreates: Array<{ data: Record<string, unknown> }> = [];
  const imageCreates: Array<{ data: Record<string, unknown> }> = [];
  const transaction = {
    property: {
      create: async (args: { data: Record<string, unknown> }) => {
        propertyCreates.push(args);
        return { id: `property-${propertyCreates.length}` };
      },
      update: async () => ({ id: "property-1" })
    },
    propertyUnit: {
      findMany: async () => [],
      create: async (args: { data: Record<string, unknown> }) => {
        unitCreates.push(args);
        return args.data;
      },
      update: async () => ({})
    },
    propertyImage: {
      findFirst: async () => null,
      create: async (args: { data: Record<string, unknown> }) => {
        imageCreates.push(args);
        return args.data;
      },
      update: async () => ({})
    }
  };
  (prisma as unknown as { $transaction: (callback: (tx: typeof transaction) => Promise<unknown>) => Promise<unknown> }).$transaction = (callback) => callback(transaction);

  const rental = {
    ...losAngelesSale,
    property_id: "la-zillow-rent-2001",
    property_name: "Los Angeles Rental",
    listing_type: "FOR_RENT",
    price: 3200,
    status: "FOR_RENT",
    status_text: "Active",
    units: [{ externalId: "la-rent-unit-1", bedrooms: 3, bathrooms: 2, rent: 3200, sqft: 1480, isAvailable: true }]
  };
  const secondRental = { ...rental, property_id: "la-zillow-rent-2002", property_name: "Second Los Angeles Rental" };
  const result = await importProperties([rental, secondRental, rental], { organizationId: "org-a" });

  assert.deepEqual(result.summary, { received: 3, created: 2, updated: 0, skipped: 1, failed: 0 });
  assert.equal(result.results[2].status, "SKIPPED");
  assert.equal(propertyCreates[0].data.rent, 3200);
  assert.equal(propertyCreates[0].data.salePrice, null);
  assert.equal(propertyCreates[0].data.organizationId, "org-a");
  assert.equal(propertyCreates[0].data.sourceName, "Zillow");
  assert.equal(unitCreates.length, 2);
  assert.equal(propertyCreates[0].data.availabilityCount, 1);
  assert.equal(propertyCreates[0].data.status, "AVAILABLE");
  assert.equal(propertyCreates[0].data.publicationStatus, "PENDING_REVIEW");
  assert.equal(result.results[0].review?.decision, "PENDING_REVIEW");
  assert.ok(result.results[0].review?.reasons.includes("duplicate_external_id_in_import"));
  assert.equal(propertyCreates[1].data.publicationStatus, "PUBLISHED");
  assert.equal(result.results[1].review?.decision, "PUBLISHED");
  assert.equal((propertyCreates[0].data.sourceMetadata as { importReview: { required: boolean } }).importReview.required, true);
  assert.equal(imageCreates.length, 6);
});