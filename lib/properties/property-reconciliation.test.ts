import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import { reconcileImportedProperties } from "./property-reconciliation.service";

function property(overrides: Record<string, unknown> = {}) {
  const listing = {
    property_id: "sale-1",
    listing_type: "For Sale",
    status: "Active",
    status_text: "Active",
    price: "$325,000",
    bedrooms: 3,
    bathrooms: 2,
    living_area: 1600
  };
  return {
    id: "property-a",
    organizationId: "org-a",
    externalId: "zillow:sale-1",
    listingType: "For Sale",
    salePrice: 325000,
    rent: 0,
    sourceName: "Zillow",
    sourceMetadata: { sourceListing: listing, importReview: { required: false, reasons: [] } },
    title: "Test sale",
    description: "A genuine property with useful and specific listing details.",
    address: "1 Main Street",
    city: "Austin",
    state: "TX",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1600,
    status: "UNAVAILABLE",
    availabilityCount: 0,
    availabilityStatusSource: "AUTOMATIC",
    publicationStatus: "PENDING_REVIEW",
    publicationStatusSource: "AUTOMATIC",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    units: [],
    images: [{ url: "https://example.test/property.jpg" }],
    ...overrides
  };
}

function installDatabase(
  records: ReturnType<typeof property>[],
  options: { failUpdatesFor?: string[] } = {}
) {
  const originalFindMany = prisma.property.findMany;
  const originalFindFirst = prisma.property.findFirst;
  const originalUpdateMany = prisma.property.updateMany;
  const queries: Array<Record<string, unknown>> = [];
  let onFindFirst: (() => void) | null = null;
  let writes = 0;

  prisma.property.findMany = (async (args: { where: { organizationId: string; id?: { gt: string } }; take: number }) => {
    queries.push(args.where);
    return records
      .filter((record) => record.organizationId === args.where.organizationId
        && (!args.where.id || record.id > args.where.id.gt))
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, args.take);
  }) as unknown as typeof prisma.property.findMany;
  prisma.property.findFirst = (async ({ where }: { where: { id: string; organizationId: string } }) => {
    onFindFirst?.();
    onFindFirst = null;
    return records.find((record) => record.id === where.id && record.organizationId === where.organizationId) ?? null;
  }) as unknown as typeof prisma.property.findFirst;
  prisma.property.updateMany = (async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
    writes++;
    if (options.failUpdatesFor?.includes(String(where.id))) throw new Error("simulated update failure");
    const record = records.find((item) => item.id === where.id && item.organizationId === where.organizationId
      && item.externalId === where.externalId && item.status === where.status
      && item.publicationStatus === where.publicationStatus
      && item.publicationStatusSource === where.publicationStatusSource
      && item.availabilityStatusSource === where.availabilityStatusSource
      && item.updatedAt.getTime() === (where.updatedAt as Date).getTime());
    if (!record) return { count: 0 };
    Object.assign(record, data);
    return { count: 1 };
  }) as unknown as typeof prisma.property.updateMany;

  return {
    queries,
    get writes() { return writes; },
    set onFindFirst(callback: (() => void) | null) { onFindFirst = callback; },
    restore() {
      prisma.property.findMany = originalFindMany;
      prisma.property.findFirst = originalFindFirst;
      prisma.property.updateMany = originalUpdateMany;
    }
  };
}

test("reconciliation dry-run previews only verified changes and scopes queries to the organization", async () => {
  const activeSale = property({ organizationId: "org-a" });
  const inactiveSale = property({
    id: "property-b",
    externalId: "zillow:sale-2",
    organizationId: "org-a",
    status: "AVAILABLE",
    publicationStatus: "PUBLISHED",
    sourceMetadata: { sourceListing: { property_id: "sale-2", status: "Sold", status_text: "Sold" } }
  });
  const uncertainSale = property({
    id: "property-c",
    externalId: "zillow:sale-3",
    organizationId: "org-a",
    status: "AVAILABLE",
    sourceMetadata: { sourceListing: { property_id: "sale-3", status: "Foreclosure", marketing_status: "FOR_SALE" } }
  });
  const missingRental = property({
    id: "property-d",
    externalId: "zillow:rent-1",
    organizationId: "org-a",
    listingType: "For Rent",
    salePrice: null,
    rent: 0,
    sourceMetadata: { sourceListing: { property_id: "rent-1", listing_type: "For Rent", status: "Active" } }
  });
  const unknown = property({
    id: "property-e",
    externalId: null,
    organizationId: "org-a",
    listingType: null,
    sourceName: null,
    sourceMetadata: null
  });
  const otherOrg = property({ id: "property-z", organizationId: "org-b" });
  const db = installDatabase([activeSale, inactiveSale, uncertainSale, missingRental, unknown, otherOrg]);

  try {
    const report = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true, batchSize: 2 });
    assert.equal(report.mode, "DRY_RUN");
    assert.equal(report.scanned, 5);
    assert.equal(report.eligibleForAvailabilityCorrection, 2);
    assert.equal(report.eligibleForPublication, 1);
    assert.equal(report.remainUnavailable, 2);
    assert.equal(report.needsMissingInformation, 2);
    assert.equal(report.uncertainSourceStatus, 1);
    assert.equal(report.confirmedInactive, 1);
    assert.equal(report.unknownListingCategory, 1);
    assert.equal(report.specialListingReview, 1);
    assert.equal(report.candidates.length, 5);
    const specialCandidate = report.candidates.find((candidate) => candidate.id === "property-c");
    assert.equal(specialCandidate?.action, "REVIEW");
    assert.equal(specialCandidate?.eligibleForPublication, false);
    assert.equal(db.writes, 0);
    assert.ok(db.queries.every((query) => query.organizationId === "org-a"));
    assert.equal(activeSale.status, "UNAVAILABLE");
    assert.equal(inactiveSale.status, "AVAILABLE");
  } finally {
    db.restore();
  }
});

test("reconciliation execution is idempotent and never changes other organizations", async () => {
  const activeSale = property({ organizationId: "org-a" });
  const otherOrg = property({ id: "property-z", organizationId: "org-b" });
  const db = installDatabase([activeSale, otherOrg]);

  try {
    const firstPreview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true, batchSize: 1 });
    const first = await reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      batchSize: 1,
      expectedPreviewToken: firstPreview.previewToken
    });
    assert.equal(first.appliedAvailabilityChanges, 1);
    assert.equal(first.appliedPublicationChanges, 1);
    assert.equal(activeSale.status, "AVAILABLE");
    assert.equal(activeSale.availabilityStatusSource, "AUTOMATIC");
    assert.equal(activeSale.publicationStatus, "PUBLISHED");
    assert.equal(otherOrg.status, "UNAVAILABLE");

    const secondPreview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true, batchSize: 1 });
    const second = await reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      batchSize: 1,
      expectedPreviewToken: secondPreview.previewToken
    });
    assert.equal(second.eligibleForAvailabilityCorrection, 0);
    assert.equal(second.eligibleForPublication, 0);
    assert.equal(second.appliedAvailabilityChanges, 0);
    assert.equal(second.appliedPublicationChanges, 0);
    assert.equal(db.writes, 1);
  } finally {
    db.restore();
  }
});

test("reconciliation preserves staff rejection while correcting source-verified availability", async () => {
  const rejected = property({
    organizationId: "org-a",
    publicationStatus: "REJECTED",
    publicationStatusSource: "STAFF"
  });
  const db = installDatabase([rejected]);
  try {
    const preview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true });
    const report = await reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      expectedPreviewToken: preview.previewToken
    });
    assert.equal(report.appliedAvailabilityChanges, 1);
    assert.equal(report.appliedPublicationChanges, 0);
    assert.equal(rejected.status, "AVAILABLE");
    assert.equal(rejected.publicationStatus, "REJECTED");
  } finally {
    db.restore();
  }
});

test("reconciliation preserves approved-unpublished decisions regardless of decision source", async () => {
  const approvedUnpublished = property({
    organizationId: "org-a",
    publicationStatus: "APPROVED_UNPUBLISHED",
    publicationStatusSource: "AUTOMATIC"
  });
  const db = installDatabase([approvedUnpublished]);
  try {
    const preview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true });
    const report = await reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      expectedPreviewToken: preview.previewToken
    });
    assert.equal(report.appliedAvailabilityChanges, 1);
    assert.equal(report.appliedPublicationChanges, 0);
    assert.equal(approvedUnpublished.status, "AVAILABLE");
    assert.equal(approvedUnpublished.publicationStatus, "APPROVED_UNPUBLISHED");
  } finally {
    db.restore();
  }
});

test("reconciliation skips staff-managed availability and publication decisions", async () => {
  const staffManaged = property({
    organizationId: "org-a",
    availabilityStatusSource: "STAFF",
    publicationStatus: "PENDING_REVIEW"
  });
  const db = installDatabase([staffManaged]);
  try {
    const preview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true });
    const candidate = preview.candidates.find((item) => item.id === staffManaged.id);
    assert.equal(preview.eligibleForAvailabilityCorrection, 0);
    assert.equal(preview.eligibleForPublication, 0);
    assert.equal(preview.staffAvailabilityDecision, 1);
    assert.equal(candidate?.reasons.includes("availability_decision_staff_managed"), true);
    assert.equal(candidate?.availabilityStatusSource, "STAFF");
    const result = await reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      expectedPreviewToken: preview.previewToken
    });
    assert.equal(result.appliedCount, 0);
    assert.equal(db.writes, 0);
    assert.equal(staffManaged.status, "UNAVAILABLE");
    assert.equal(staffManaged.availabilityStatusSource, "STAFF");
  } finally {
    db.restore();
  }
});

test("reconciliation skips unknown availability provenance until verified", async () => {
  const unknown = property({
    organizationId: "org-a",
    availabilityStatusSource: "UNKNOWN"
  });
  const db = installDatabase([unknown]);
  try {
    const preview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true });
    const candidate = preview.candidates.find((item) => item.id === unknown.id);
    assert.equal(preview.eligibleForAvailabilityCorrection, 0);
    assert.equal(preview.eligibleForPublication, 0);
    assert.equal(preview.unknownAvailabilityDecision, 1);
    assert.equal(candidate?.reasons.includes("availability_decision_origin_unknown"), true);
    assert.equal(candidate?.availabilityStatusSource, "UNKNOWN");
    const result = await reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      expectedPreviewToken: preview.previewToken
    });
    assert.equal(result.appliedCount, 0);
    assert.equal(db.writes, 0);
    assert.equal(unknown.status, "UNAVAILABLE");
    assert.equal(unknown.availabilityStatusSource, "UNKNOWN");
  } finally {
    db.restore();
  }
});

test("reconciliation refuses a stale preview token before making any updates", async () => {
  const activeSale = property({ organizationId: "org-a" });
  const db = installDatabase([activeSale]);
  try {
    await assert.rejects(
      reconcileImportedProperties({
        organizationId: "org-a",
        dryRun: false,
        expectedPreviewToken: "stale"
      }),
      /changed since preview/
    );
    assert.equal(db.writes, 0);
    assert.equal(activeSale.status, "UNAVAILABLE");
  } finally {
    db.restore();
  }
});

test("preview token binds organization and all property data", async () => {
  const record = property({ organizationId: "org-a" });
  const db = installDatabase([record]);
  try {
    const preview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true });
    record.sourceMetadata.sourceListing.status = "Sold";
    record.sourceMetadata.sourceListing.status_text = "Sold";
    await assert.rejects(reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      expectedPreviewToken: preview.previewToken
    }), /changed since preview/);
    assert.equal(db.writes, 0);

    await assert.rejects(reconcileImportedProperties({
      organizationId: "org-b",
      dryRun: false,
      expectedPreviewToken: preview.previewToken
    }), /changed since preview/);
    assert.equal(db.writes, 0);
  } finally {
    db.restore();
  }
});

test("preview token detects changes to statuses, prices and record version", async () => {
  const mutations: Array<(record: ReturnType<typeof property>) => void> = [
    (record) => { record.status = "AVAILABLE"; },
    (record) => { record.publicationStatus = "REJECTED"; },
    (record) => { record.salePrice = 326000; },
    (record) => { record.availabilityStatusSource = "STAFF"; },
    (record) => { record.updatedAt = new Date("2026-02-01T00:00:00.000Z"); }
  ];

  for (const mutate of mutations) {
    const record = property({ organizationId: "org-a" });
    const db = installDatabase([record]);
    try {
      const preview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true });
      mutate(record);
      await assert.rejects(reconcileImportedProperties({
        organizationId: "org-a",
        dryRun: false,
        expectedPreviewToken: preview.previewToken
      }), /changed since preview/);
      assert.equal(db.writes, 0);
    } finally {
      db.restore();
    }
  }
});

test("reconciliation skips a candidate changed after token validation", async () => {
  const record = property({ organizationId: "org-a" });
  const db = installDatabase([record]);
  try {
    const preview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true });
    db.onFindFirst = () => {
      record.sourceMetadata.sourceListing.status = "Sold";
      record.sourceMetadata.sourceListing.status_text = "Sold";
    };
    const execution = await reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      expectedPreviewToken: preview.previewToken
    });
    assert.equal(execution.appliedCount, 0);
    assert.equal(execution.skippedCount, 1);
    assert.equal(record.status, "UNAVAILABLE");
    assert.equal(db.writes, 0);
  } finally {
    db.restore();
  }
});

test("reconciliation skips a candidate whose availability provenance changes after token validation", async () => {
  const record = property({ organizationId: "org-a" });
  const db = installDatabase([record]);
  try {
    const preview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true });
    db.onFindFirst = () => {
      record.availabilityStatusSource = "STAFF";
    };
    const execution = await reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      expectedPreviewToken: preview.previewToken
    });
    assert.equal(execution.appliedCount, 0);
    assert.equal(execution.skippedCount, 1);
    assert.equal(record.status, "UNAVAILABLE");
    assert.equal(record.availabilityStatusSource, "STAFF");
    assert.equal(db.writes, 0);
  } finally {
    db.restore();
  }
});

test("partial execution reports successful and failed updates", async () => {
  const successful = property({ organizationId: "org-a" });
  const failed = property({
    id: "property-b",
    externalId: "zillow:sale-2",
    organizationId: "org-a",
    sourceMetadata: {
      sourceListing: {
        property_id: "sale-2",
        listing_type: "For Sale",
        status: "Active",
        status_text: "Active",
        price: "$325,000",
        bedrooms: 3,
        bathrooms: 2,
        living_area: 1600
      },
      importReview: { required: false, reasons: [] }
    }
  });
  const db = installDatabase([successful, failed], { failUpdatesFor: ["property-b"] });
  try {
    const preview = await reconcileImportedProperties({ organizationId: "org-a", dryRun: true });
    const execution = await reconcileImportedProperties({
      organizationId: "org-a",
      dryRun: false,
      expectedPreviewToken: preview.previewToken
    });
    assert.equal(execution.appliedCount, 1);
    assert.equal(execution.failedCount, 1);
    assert.equal(execution.errors.length, 1);
    assert.equal(successful.status, "AVAILABLE");
    assert.equal(failed.status, "UNAVAILABLE");
  } finally {
    db.restore();
  }
});
