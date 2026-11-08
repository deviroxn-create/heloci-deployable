import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import {
  activateAuthorizedSaleInventory,
  previewAuthorizedSaleActivation
} from "./property-sale-activation.service";

function property(index: number) {
  const externalId = `zillow:activation-${index}`;
  return {
    id: `activation-property-${String(index).padStart(3, "0")}`,
    organizationId: "org_heloci",
    externalId,
    listingType: "For Sale",
    salePrice: 325000,
    rent: 0,
    sourceName: "Zillow",
    sourceMetadata: {
      sourceListing: {
        property_id: `activation-${index}`,
        listing_type: "For Sale",
        status: "Active",
        status_text: "Active"
      }
    },
    title: `Sale property ${index}`,
    description: "A detailed sale listing with a meaningful property description.",
    address: "1 Main Street",
    city: "Austin",
    state: "TX",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    status: "UNAVAILABLE",
    availabilityCount: 0,
    availabilityStatusSource: "UNKNOWN",
    publicationStatus: "PENDING_REVIEW",
    publicationStatusSource: "AUTOMATIC",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    units: [],
    images: [{ id: `image-${index}`, url: `https://example.test/${index}.jpg`, altText: null }]
  };
}

function installDatabase(
  records: ReturnType<typeof property>[],
  options: {
    applyUpdates?: boolean;
    failPropertyUpdate?: boolean;
    failAuditInsertion?: boolean;
    failTransactionCompletion?: boolean;
    persistAuditEntries?: boolean;
  } = {}
) {
  const originalFindMany = prisma.property.findMany;
  const originalTransaction = prisma.$transaction;
  const originalAuditFindMany = prisma.auditLog.findMany;
  const originalConsoleError = console.error;
  const auditRecords: Array<{ data: Record<string, unknown> }> = [];
  const updates: Array<{
    where: { OR: Array<Record<string, unknown>> };
    data: Record<string, unknown>;
  }> = [];
  const logs: unknown[][] = [];

  const findManyFor = (sourceRecords: ReturnType<typeof property>[]) => async (args: {
    where: { organizationId: string; id?: { gt?: string; in?: string[] } };
    take?: number;
  }) => {
    const ids = args.where.id?.in ? new Set(args.where.id.in) : null;
    const matches = sourceRecords
      .filter((record) => record.organizationId === args.where.organizationId
        && (!args.where.id?.gt || record.id > args.where.id.gt)
        && (!ids || ids.has(record.id)))
      .sort((a, b) => a.id.localeCompare(b.id));
    return args.take === undefined ? matches : matches.slice(0, args.take);
  };
  type MockFindMany = ReturnType<typeof findManyFor>;

  const updateMany = async (
    sourceRecords: ReturnType<typeof property>[],
    { where, data }: { where: { OR: Array<Record<string, unknown>> }; data: Record<string, unknown> }
  ) => {
    updates.push({ where, data });
    if (options.failPropertyUpdate) throw new Error("property update failed");
    const matches = sourceRecords.filter((record) => where.OR.some((condition) =>
      record.id === condition.id
      && record.organizationId === condition.organizationId
      && record.externalId === condition.externalId
      && record.sourceName === condition.sourceName
      && record.listingType === condition.listingType
      && record.salePrice === condition.salePrice
      && record.status === condition.status
      && record.publicationStatus === condition.publicationStatus
      && record.publicationStatusSource === condition.publicationStatusSource
      && record.availabilityStatusSource === condition.availabilityStatusSource
      && record.updatedAt.getTime() === (condition.updatedAt as Date).getTime()
    ));
    if (options.applyUpdates !== false) matches.forEach((record) => Object.assign(record, data));
    return { count: matches.length };
  };

  prisma.property.findMany = findManyFor(records) as unknown as typeof prisma.property.findMany;
  prisma.auditLog.findMany = (async () => auditRecords.map((record) => ({ meta: record.data.meta }))) as unknown as typeof prisma.auditLog.findMany;
  console.error = (...args: unknown[]) => { logs.push(args); };
  (prisma as unknown as {
    $transaction: (callback: (tx: {
      $queryRaw: (...args: unknown[]) => Promise<Array<{ id: string }>>;
      property: {
        findMany: MockFindMany;
        updateMany: (args: { where: { OR: Array<Record<string, unknown>> }; data: Record<string, unknown> }) => Promise<{ count: number }>;
      };
      auditLog: {
        createMany: (args: { data: Array<Record<string, unknown>> }) => Promise<{ count: number }>;
      };
    }) => Promise<unknown>) => Promise<unknown>;
  }).$transaction = async (callback) => {
    const transactionRecords = structuredClone(records);
    const transactionAuditRecords: Array<{ data: Record<string, unknown> }> = [];
    const transactionFindMany = findManyFor(transactionRecords);
    const transaction = {
      $queryRaw: async (..._args: unknown[]) => transactionRecords.map((record) => ({ id: record.id })),
      property: {
        findMany: transactionFindMany,
        updateMany: (args: { where: { OR: Array<Record<string, unknown>> }; data: Record<string, unknown> }) =>
          updateMany(transactionRecords, args)
      },
      auditLog: {
        createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
          if (options.failAuditInsertion) throw new Error("audit insertion failed");
          transactionAuditRecords.push(...data.map((entry) => ({ data: entry })));
          return { count: data.length };
        }
      }
    };
    const result = await callback(transaction);
    if (options.failTransactionCompletion) throw new Error("transaction completion failed");
    transactionRecords.forEach((record, index) => Object.assign(records[index], record));
    if (options.persistAuditEntries !== false) auditRecords.push(...transactionAuditRecords);
    return result;
  };

  return {
    auditRecords,
    updates,
    logs,
    restore() {
      prisma.property.findMany = originalFindMany;
      prisma.auditLog.findMany = originalAuditFindMany;
      prisma.$transaction = originalTransaction;
      console.error = originalConsoleError;
    }
  };
}

test("sale activation previews and atomically audits exactly the approved scope", async () => {
  const records = Array.from({ length: 416 }, (_, index) => property(index));
  const db = installDatabase(records);

  try {
    const preview = await previewAuthorizedSaleActivation("org_heloci");
    assert.equal(preview.mode, "DRY_RUN");
    assert.equal(preview.scanned, 416);
    assert.equal(preview.candidateCount, 416);
    assert.ok(records.every((record) => record.status === "UNAVAILABLE"));

    const result = await activateAuthorizedSaleInventory({
      organizationId: "org_heloci",
      actorUserId: "authenticated-admin",
      expectedPreviewToken: preview.previewToken,
      approvedPropertyIds: preview.candidates.map((candidate) => candidate.propertyId),
      approvedScopeDigest: preview.candidateIdDigest
    });

    assert.equal(result.mode, "EXECUTED");
    assert.equal(result.activatedCount, 416);
    assert.equal(result.skippedCount, 0);
    assert.equal(result.failedCount, 0);
    assert.equal(result.auditEntriesCreated, 416);
    assert.equal(result.auditEntriesVerified, 416);
    assert.equal(result.auditVerified, true);
    assert.equal(result.persistedRecordsVerified, 416);
    assert.equal(result.persistedStateVerified, true);
    assert.equal(db.updates.length, 1);
    assert.equal(db.updates[0].where.OR.length, 416);
    assert.equal(db.auditRecords.length, 416);
    assert.ok(records.every((record) =>
      record.status === "AVAILABLE"
      && record.publicationStatus === "PUBLISHED"
      && record.availabilityStatusSource === "STAFF"
      && record.publicationStatusSource === "STAFF"
      && record.salePrice === 325000
      && record.availabilityCount === 0
      && record.units.length === 0
      && record.images.length === 1
    ));

    const firstAudit = db.auditRecords[0].data;
    const meta = firstAudit.meta as Record<string, unknown>;
    assert.equal(firstAudit.userId, "authenticated-admin");
    assert.equal(firstAudit.action, "staff_sale_inventory_activated");
    assert.equal(firstAudit.createdAt instanceof Date, true);
    assert.equal(meta.reason, result.reason);
    assert.equal(meta.timestamp, result.activatedAt);
    assert.deepEqual(meta.previousValues, {
      status: "UNAVAILABLE",
      publicationStatus: "PENDING_REVIEW",
      availabilityStatusSource: "UNKNOWN",
      publicationStatusSource: "AUTOMATIC"
    });
    assert.deepEqual(meta.newValues, {
      status: "AVAILABLE",
      publicationStatus: "PUBLISHED",
      availabilityStatusSource: "STAFF",
      publicationStatusSource: "STAFF"
    });
  } finally {
    db.restore();
  }
});

test("sale activation reports unverified persisted state after commit", async () => {
  const records = Array.from({ length: 416 }, (_, index) => property(index));
  const db = installDatabase(records, { applyUpdates: false });

  try {
    const preview = await previewAuthorizedSaleActivation("org_heloci");
    const result = await activateAuthorizedSaleInventory({
      organizationId: "org_heloci",
      actorUserId: "authenticated-admin",
      expectedPreviewToken: preview.previewToken,
      approvedPropertyIds: preview.candidates.map((candidate) => candidate.propertyId),
      approvedScopeDigest: preview.candidateIdDigest
    });

    assert.equal(result.activatedCount, 416);
    assert.equal(result.auditVerified, true);
    assert.equal(result.persistedRecordsVerified, 0);
    assert.equal(result.persistedStateVerified, false);
    assert.equal(result.failedCount, 1);
    assert.equal((db.logs[0][1] as { stage: string }).stage, "post_commit_verification");
  } finally {
    db.restore();
  }
});

test("sale activation rolls back all property changes when the bulk update fails", async () => {
  const records = Array.from({ length: 416 }, (_, index) => property(index));
  const db = installDatabase(records, { failPropertyUpdate: true });

  try {
    const preview = await previewAuthorizedSaleActivation("org_heloci");
    await assert.rejects(activateAuthorizedSaleInventory({
      organizationId: "org_heloci",
      actorUserId: "authenticated-admin",
      expectedPreviewToken: preview.previewToken,
      approvedPropertyIds: preview.candidates.map((candidate) => candidate.propertyId),
      approvedScopeDigest: preview.candidateIdDigest
    }), /property update failed/);

    assert.equal(db.updates.length, 1);
    assert.equal(db.auditRecords.length, 0);
    assert.ok(records.every((record) =>
      record.status === "UNAVAILABLE"
      && record.publicationStatus === "PENDING_REVIEW"
      && record.availabilityStatusSource === "UNKNOWN"
      && record.publicationStatusSource === "AUTOMATIC"
    ));
    assert.equal((db.logs[0][1] as { stage: string }).stage, "property_update");
  } finally {
    db.restore();
  }
});

test("sale activation rolls back the bulk property update when audit insertion fails", async () => {
  const records = Array.from({ length: 416 }, (_, index) => property(index));
  const db = installDatabase(records, { failAuditInsertion: true });

  try {
    const preview = await previewAuthorizedSaleActivation("org_heloci");
    await assert.rejects(activateAuthorizedSaleInventory({
      organizationId: "org_heloci",
      actorUserId: "authenticated-admin",
      expectedPreviewToken: preview.previewToken,
      approvedPropertyIds: preview.candidates.map((candidate) => candidate.propertyId),
      approvedScopeDigest: preview.candidateIdDigest
    }), /audit insertion failed/);

    assert.equal(db.updates.length, 1);
    assert.equal(db.auditRecords.length, 0);
    assert.ok(records.every((record) =>
      record.status === "UNAVAILABLE"
      && record.publicationStatus === "PENDING_REVIEW"
      && record.availabilityStatusSource === "UNKNOWN"
      && record.publicationStatusSource === "AUTOMATIC"
    ));
    assert.equal((db.logs[0][1] as { stage: string }).stage, "audit_insertion");
  } finally {
    db.restore();
  }
});

test("sale activation rolls back and logs transaction completion failures", async () => {
  const records = Array.from({ length: 416 }, (_, index) => property(index));
  const db = installDatabase(records, { failTransactionCompletion: true });

  try {
    const preview = await previewAuthorizedSaleActivation("org_heloci");
    await assert.rejects(activateAuthorizedSaleInventory({
      organizationId: "org_heloci",
      actorUserId: "authenticated-admin",
      expectedPreviewToken: preview.previewToken,
      approvedPropertyIds: preview.candidates.map((candidate) => candidate.propertyId),
      approvedScopeDigest: preview.candidateIdDigest
    }), /transaction completion failed/);

    assert.equal(db.auditRecords.length, 0);
    assert.ok(records.every((record) =>
      record.status === "UNAVAILABLE"
      && record.publicationStatus === "PENDING_REVIEW"
      && record.availabilityStatusSource === "UNKNOWN"
      && record.publicationStatusSource === "AUTOMATIC"
    ));
    assert.equal((db.logs[0][1] as { stage: string }).stage, "transaction_completion");
  } finally {
    db.restore();
  }
});

test("sale activation reports audit verification failure after the transaction commits", async () => {
  const records = Array.from({ length: 416 }, (_, index) => property(index));
  const db = installDatabase(records, { persistAuditEntries: false });

  try {
    const preview = await previewAuthorizedSaleActivation("org_heloci");
    const result = await activateAuthorizedSaleInventory({
      organizationId: "org_heloci",
      actorUserId: "authenticated-admin",
      expectedPreviewToken: preview.previewToken,
      approvedPropertyIds: preview.candidates.map((candidate) => candidate.propertyId),
      approvedScopeDigest: preview.candidateIdDigest
    });

    assert.equal(result.activatedCount, 416);
    assert.equal(result.auditEntriesVerified, 0);
    assert.equal(result.auditVerified, false);
    assert.equal(result.persistedStateVerified, true);
    assert.equal(result.failedCount, 1);
    assert.equal((db.logs[0][1] as { stage: string }).stage, "post_commit_verification");
  } finally {
    db.restore();
  }
});

test("sale activation refuses a changed candidate set before writes", async () => {
  const records = Array.from({ length: 416 }, (_, index) => property(index));
  const db = installDatabase(records);

  try {
    const preview = await previewAuthorizedSaleActivation("org_heloci");
    const approvedPropertyIds = preview.candidates.map((candidate) => candidate.propertyId);
    approvedPropertyIds[0] = "not-in-the-preview";

    await assert.rejects(activateAuthorizedSaleInventory({
      organizationId: "org_heloci",
      actorUserId: "authenticated-admin",
      expectedPreviewToken: preview.previewToken,
      approvedPropertyIds,
      approvedScopeDigest: preview.candidateIdDigest
    }), /SALE_ACTIVATION_SCOPE_MISMATCH/);
    assert.equal(db.updates.length, 0);
    assert.equal(db.auditRecords.length, 0);
    assert.ok(records.every((record) => record.status === "UNAVAILABLE"));
  } finally {
    db.restore();
  }
});

test("sale activation rejects a stale preview and any other organization", async () => {
  const records = Array.from({ length: 416 }, (_, index) => property(index));
  const db = installDatabase(records);

  try {
    const preview = await previewAuthorizedSaleActivation("org_heloci");
    records[0].salePrice++;
    await assert.rejects(activateAuthorizedSaleInventory({
      organizationId: "org_heloci",
      actorUserId: "authenticated-admin",
      expectedPreviewToken: preview.previewToken,
      approvedPropertyIds: preview.candidates.map((candidate) => candidate.propertyId),
      approvedScopeDigest: preview.candidateIdDigest
    }), /SALE_ACTIVATION_PREVIEW_STALE/);
    await assert.rejects(previewAuthorizedSaleActivation("org-other"), /SALE_ACTIVATION_ORGANIZATION_NOT_ALLOWED/);
    assert.equal(db.updates.length, 0);
    assert.equal(db.auditRecords.length, 0);
  } finally {
    db.restore();
  }
});
