import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import {
  approveUnknownAvailabilityProvenance,
  getUnknownAvailabilityProvenanceReport
} from "./property-availability-provenance.service";

function property(overrides: Record<string, unknown> = {}) {
  return {
    id: "property-a",
    organizationId: "org-a",
    title: "Test sale",
    description: "A well-maintained property with substantial living space.",
    address: "1 Main Street",
    city: "Austin",
    state: "TX",
    externalId: "zillow:sale-1",
    sourceName: "Zillow",
    sourceStatus: "Active",
    sourceMetadata: {
      sourceListing: { property_id: "sale-1", status: "Active", status_text: "Active" },
      helociAvailabilityDecision: { version: 1, source: "AUTOMATIC", status: "UNAVAILABLE" }
    },
    listingType: "For Sale",
    status: "UNAVAILABLE",
    availabilityCount: 0,
    availabilityStatusSource: "UNKNOWN",
    publicationStatus: "PENDING_REVIEW",
    rent: 0,
    salePrice: 325000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1600,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    units: [] as Array<{ id: string; beds: number; price: number; available: boolean }>,
    images: [{ url: "https://example.test/property.jpg" }],
    ...overrides
  };
}

function installDatabase(records: ReturnType<typeof property>[]) {
  const originalFindMany = prisma.property.findMany;
  const originalFindFirst = prisma.property.findFirst;
  const originalUpdateMany = prisma.property.updateMany;
  const originalTransaction = prisma.$transaction;
  const originalAuditCreate = prisma.auditLog.create;
  const auditRecords: unknown[] = [];
  let writeCount = 0;
  let lockCount = 0;

  prisma.property.findMany = (async ({ where }: { where: { organizationId: string; availabilityStatusSource: string } }) =>
    records.filter((record) => record.organizationId === where.organizationId
      && record.availabilityStatusSource === where.availabilityStatusSource)) as unknown as typeof prisma.property.findMany;
  prisma.property.findFirst = (async ({ where }: { where: { id: string; organizationId: string; availabilityStatusSource: string } }) =>
    records.find((record) => record.id === where.id
      && record.organizationId === where.organizationId
      && record.availabilityStatusSource === where.availabilityStatusSource) ?? null) as unknown as typeof prisma.property.findFirst;

  const transaction = {
    $queryRaw: async () => { lockCount++; return []; },
    $executeRaw: async (_query: TemplateStringsArray, ...values: unknown[]) => {
      writeCount++;
      const [decision, id, organizationId, status, availabilityCount, listingType, externalId, sourceName, sourceStatus, publicationStatus, rent, salePrice, updatedAt] = values;
      const record = records.find((item) => item.id === id
        && item.organizationId === organizationId
        && item.availabilityStatusSource === "UNKNOWN"
        && item.status === status
        && item.availabilityCount === availabilityCount
        && item.listingType === listingType
        && item.externalId === externalId
        && item.sourceName === sourceName
        && item.sourceStatus === sourceStatus
        && item.publicationStatus === publicationStatus
        && item.rent === rent
        && item.salePrice === salePrice
        && item.updatedAt.getTime() === (updatedAt as Date).getTime());
      if (!record) return 0;
      Object.assign(record, { availabilityStatusSource: decision });
      return 1;
    },
    property: {
      findFirst: async ({ where }: { where: { id: string; organizationId: string; availabilityStatusSource: string } }) =>
        records.find((record) => record.id === where.id
          && record.organizationId === where.organizationId
          && record.availabilityStatusSource === where.availabilityStatusSource) ?? null,
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        writeCount++;
        const record = records.find((item) => item.id === where.id
          && item.organizationId === where.organizationId
          && item.availabilityStatusSource === where.availabilityStatusSource
          && item.status === where.status
          && item.availabilityCount === where.availabilityCount
          && item.listingType === where.listingType
          && item.externalId === where.externalId
          && item.sourceName === where.sourceName
          && item.sourceStatus === where.sourceStatus
          && item.publicationStatus === where.publicationStatus
          && item.rent === where.rent
          && item.salePrice === where.salePrice
          && item.updatedAt.getTime() === (where.updatedAt as Date).getTime());
        if (!record) return { count: 0 };
        Object.assign(record, data);
        return { count: 1 };
      }
    },
    auditLog: {
      create: async ({ data }: { data: unknown }) => { auditRecords.push(data); return data; }
    }
  };
  (prisma as unknown as { $transaction: (callback: (tx: typeof transaction) => Promise<unknown>, options?: unknown) => Promise<unknown> }).$transaction =
    async (callback) => callback(transaction);
  prisma.auditLog.create = (async ({ data }: { data: unknown }) => { auditRecords.push(data); return data; }) as unknown as typeof prisma.auditLog.create;

  return {
    auditRecords,
    get lockCount() { return lockCount; },
    get writeCount() { return writeCount; },
    restore() {
      prisma.property.findMany = originalFindMany;
      prisma.property.findFirst = originalFindFirst;
      prisma.property.updateMany = originalUpdateMany;
      prisma.$transaction = originalTransaction;
      prisma.auditLog.create = originalAuditCreate;
    }
  };
}

test("review report is organization-scoped and Zillow active status alone is not provenance evidence", async () => {
  const strong = property();
  const historical = property({
    id: "property-b",
    externalId: "zillow:sale-2",
    sourceMetadata: { sourceListing: { property_id: "sale-2", status: "Active" } }
  });
  const invalid = property({
    id: "property-c",
    externalId: "zillow:sale-3",
    salePrice: null,
    sourceMetadata: {
      sourceListing: { property_id: "sale-3", status: "Active" },
      helociAvailabilityDecision: { version: 1, source: "AUTOMATIC", status: "UNAVAILABLE" }
    }
  });
  const anotherOrganization = property({ id: "property-other", organizationId: "org-b" });
  const db = installDatabase([strong, historical, invalid, anotherOrganization]);
  try {
    const report = await getUnknownAvailabilityProvenanceReport("org-a");
    assert.equal(report.totalUnknown, 3);
    assert.deepEqual(report.categories, {
      strongAutomaticEvidence: 1,
      staffReviewRequired: 1,
      notEligibleForAutomaticApproval: 1
    });
    assert.equal(report.listingCategories.sale, 3);
    assert.equal(report.candidates.find((candidate) => candidate.id === "property-b")?.automaticApprovalEligible, false);
    assert.equal(report.candidates.find((candidate) => candidate.id === "property-b")?.evidenceCategory, "STAFF_REVIEW_REQUIRED");
    assert.deepEqual(report.candidates.find((candidate) => candidate.id === "property-a")?.imageUrls, ["https://example.test/property.jpg"]);
    assert.equal(report.candidates.find((candidate) => candidate.id === "property-c")?.evidenceCategory, "NOT_ELIGIBLE_FOR_AUTOMATIC_APPROVAL");
  } finally {
    db.restore();
  }
});

test("automatic provenance approval changes only provenance and records an attributable audit event", async () => {
  const record = property({
    units: [{ id: "unit-a", beds: 2, price: 1800, available: true }],
    images: [{ url: "https://example.test/property.jpg" }, { url: "https://example.test/second.jpg" }]
  });
  const db = installDatabase([record]);
  const before = {
    status: record.status,
    availabilityCount: record.availabilityCount,
    publicationStatus: record.publicationStatus,
    rent: record.rent,
    salePrice: record.salePrice,
    listingType: record.listingType,
    externalId: record.externalId,
    sourceMetadata: structuredClone(record.sourceMetadata),
    units: structuredClone(record.units),
    images: structuredClone(record.images),
    updatedAt: record.updatedAt
  };
  try {
    const report = await getUnknownAvailabilityProvenanceReport("org-a");
    const candidate = report.candidates[0];
    const result = await approveUnknownAvailabilityProvenance({
      organizationId: "org-a",
      propertyId: record.id,
      actorUserId: "admin-a",
      decision: "AUTOMATIC",
      reason: "Importer decision marker matches persisted status and identity.",
      confirmIntentionalAvailability: false,
      expectedEvidenceToken: candidate.evidenceToken
    });
    assert.equal(result.availabilityStatusSource, "AUTOMATIC");
    assert.deepEqual({
      status: record.status,
      availabilityCount: record.availabilityCount,
      publicationStatus: record.publicationStatus,
      rent: record.rent,
      salePrice: record.salePrice,
      listingType: record.listingType,
      externalId: record.externalId,
      sourceMetadata: record.sourceMetadata,
      units: record.units,
      images: record.images,
      updatedAt: record.updatedAt
    }, before);
    assert.equal(db.auditRecords.length, 1);
    const audit = db.auditRecords[0] as { userId: string; meta: { reason: string; propertyId: string; approvedSource: string } };
    assert.equal(audit.userId, "admin-a");
    assert.equal(audit.meta.reason, "Importer decision marker matches persisted status and identity.");
    assert.equal(audit.meta.propertyId, record.id);
    assert.equal(audit.meta.approvedSource, "AUTOMATIC");
    assert.equal(db.lockCount, 3);
    assert.equal(db.writeCount, 1);
  } finally {
    db.restore();
  }
});

test("staff provenance requires a reason and is audited without changing property decisions", async () => {
  const record = property({ sourceMetadata: { sourceListing: { property_id: "sale-1", status: "Active" } } });
  const db = installDatabase([record]);
  try {
    const candidate = (await getUnknownAvailabilityProvenanceReport("org-a")).candidates[0];
    await assert.rejects(approveUnknownAvailabilityProvenance({
      organizationId: "org-a",
      propertyId: record.id,
      actorUserId: "admin-a",
      decision: "STAFF",
      reason: "  ",
      confirmIntentionalAvailability: true,
      expectedEvidenceToken: candidate.evidenceToken
    }), /APPROVAL_REASON_TOO_SHORT/);
    await assert.rejects(approveUnknownAvailabilityProvenance({
      organizationId: "org-a",
      propertyId: record.id,
      actorUserId: "admin-a",
      decision: "STAFF",
      reason: "This reason is long enough.",
      confirmIntentionalAvailability: false,
      expectedEvidenceToken: candidate.evidenceToken
    }), /STAFF_INTENT_CONFIRMATION_REQUIRED/);
    const result = await approveUnknownAvailabilityProvenance({
      organizationId: "org-a",
      propertyId: record.id,
      actorUserId: "admin-a",
      decision: "STAFF",
      reason: "Administrator confirms a deliberate manual decision.",
      confirmIntentionalAvailability: true,
      expectedEvidenceToken: candidate.evidenceToken
    });
    assert.equal(result.availabilityStatusSource, "STAFF");
    assert.equal(record.status, "UNAVAILABLE");
    assert.equal(record.publicationStatus, "PENDING_REVIEW");
    assert.equal(db.auditRecords.length, 1);
    const audit = db.auditRecords[0] as { meta: { confirmedIntentionalAvailability: boolean } };
    assert.equal(audit.meta.confirmedIntentionalAvailability, true);
  } finally {
    db.restore();
  }
});

test("active Zillow status without importer evidence remains UNKNOWN", async () => {
  const record = property({
    sourceMetadata: { sourceListing: { property_id: "sale-1", status: "Active", status_text: "Active" } }
  });
  const db = installDatabase([record]);
  try {
    const candidate = (await getUnknownAvailabilityProvenanceReport("org-a")).candidates[0];
    assert.equal(candidate.evidenceCategory, "STAFF_REVIEW_REQUIRED");
    assert.equal(candidate.automaticApprovalEligible, false);
    await assert.rejects(approveUnknownAvailabilityProvenance({
      organizationId: "org-a",
      propertyId: record.id,
      actorUserId: "admin-a",
      decision: "AUTOMATIC",
      reason: "Source status alone is not provenance.",
      confirmIntentionalAvailability: false,
      expectedEvidenceToken: candidate.evidenceToken
    }), /AUTOMATIC_PROVENANCE_EVIDENCE_INSUFFICIENT/);
    assert.equal(record.availabilityStatusSource, "UNKNOWN");
    assert.equal(record.status, "UNAVAILABLE");
    assert.equal(record.publicationStatus, "PENDING_REVIEW");
    assert.equal(db.writeCount, 0);
    assert.equal(db.auditRecords.length, 0);
  } finally {
    db.restore();
  }
});

test("concurrent classifications allow only one conditional update and one audit event", async () => {
  const record = property({ sourceMetadata: { sourceListing: { property_id: "sale-1", status: "Active" } } });
  const db = installDatabase([record]);
  try {
    const candidate = (await getUnknownAvailabilityProvenanceReport("org-a")).candidates[0];
    const approve = () => approveUnknownAvailabilityProvenance({
      organizationId: "org-a",
      propertyId: record.id,
      actorUserId: "admin-a",
      decision: "STAFF",
      reason: "Administrator verified intentional availability.",
      confirmIntentionalAvailability: true,
      expectedEvidenceToken: candidate.evidenceToken
    });
    const results = await Promise.allSettled([approve(), approve()]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    assert.match(String(rejected?.reason), /PROVENANCE_EVIDENCE_STALE|PROVENANCE_NOT_UNKNOWN_OR_NOT_FOUND/);
    assert.equal(record.availabilityStatusSource, "STAFF");
    assert.equal(record.status, "UNAVAILABLE");
    assert.equal(record.publicationStatus, "PENDING_REVIEW");
    assert.equal(db.auditRecords.length, 1);
  } finally {
    db.restore();
  }
});

test("stale evidence, cross-organization targets, and already classified records are rejected", async () => {
  const record = property();
  const db = installDatabase([record]);
  try {
    const candidate = (await getUnknownAvailabilityProvenanceReport("org-a")).candidates[0];
    record.sourceMetadata = {
      ...record.sourceMetadata,
      sourceListing: { property_id: "changed-id", status: "Active", status_text: "Active" }
    };
    await assert.rejects(approveUnknownAvailabilityProvenance({
      organizationId: "org-a",
      propertyId: record.id,
      actorUserId: "admin-a",
      decision: "AUTOMATIC",
      reason: "Reviewed source data.",
      confirmIntentionalAvailability: true,
      expectedEvidenceToken: candidate.evidenceToken
    }), /PROVENANCE_EVIDENCE_STALE/);
    record.availabilityStatusSource = "STAFF";
    await assert.rejects(approveUnknownAvailabilityProvenance({
      organizationId: "org-a",
      propertyId: record.id,
      actorUserId: "admin-a",
      decision: "AUTOMATIC",
      reason: "Reviewed source data.",
      confirmIntentionalAvailability: true,
      expectedEvidenceToken: candidate.evidenceToken
    }), /PROVENANCE_NOT_UNKNOWN_OR_NOT_FOUND/);
    await assert.rejects(approveUnknownAvailabilityProvenance({
      organizationId: "org-b",
      propertyId: record.id,
      actorUserId: "admin-a",
      decision: "STAFF",
      reason: "Reviewed source data.",
      confirmIntentionalAvailability: true,
      expectedEvidenceToken: candidate.evidenceToken
    }), /PROVENANCE_NOT_UNKNOWN_OR_NOT_FOUND/);
    assert.equal(db.writeCount, 0);
    assert.equal(db.auditRecords.length, 0);
  } finally {
    db.restore();
  }
});

test("changed availability, listing category, and source identity invalidate approval evidence", async () => {
  const changes: Array<(record: ReturnType<typeof property>) => void> = [
    (record) => { record.status = "AVAILABLE"; },
    (record) => { record.listingType = "For Rent"; },
    (record) => { record.externalId = "zillow:changed"; }
  ];

  for (const change of changes) {
    const record = property();
    const db = installDatabase([record]);
    try {
      const candidate = (await getUnknownAvailabilityProvenanceReport("org-a")).candidates[0];
      change(record);
      await assert.rejects(approveUnknownAvailabilityProvenance({
        organizationId: "org-a",
        propertyId: record.id,
        actorUserId: "admin-a",
        decision: "STAFF",
        reason: "Reviewed after source-data change.",
        confirmIntentionalAvailability: true,
        expectedEvidenceToken: candidate.evidenceToken
      }), /PROVENANCE_EVIDENCE_STALE/);
      assert.equal(db.writeCount, 0);
      assert.equal(db.auditRecords.length, 0);
    } finally {
      db.restore();
    }
  }
});
