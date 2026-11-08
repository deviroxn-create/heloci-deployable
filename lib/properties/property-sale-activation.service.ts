import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { getPropertyListingCategory } from "@/lib/properties/listing-category";
import {
  evaluatePropertyForApproval,
  getSaleAvailabilityValidationReasons
} from "@/lib/properties/property-review.service";
import { normalizeZillowSaleAvailability } from "@/lib/properties/zillow-listing-status";

const ORGANIZATION_ID = "org_heloci";
const APPROVED_CANDIDATE_COUNT = 416;
export const APPROVED_SALE_SCOPE_ID_DIGEST = "4f3f9945eef7b606c7970a6ff33377bdb40f9fc8a19512226a4ec9b97b7f1521";
const DEFAULT_BATCH_SIZE = 200;
const ACTIVATION_REASON = "Explicit admin authorization to activate technically eligible Zillow sale listings as HELOCI testing inventory. Historical availability provenance was unknown; this is a staff decision, not an automatic importer decision.";

const propertySelect = {
  id: true,
  organizationId: true,
  externalId: true,
  listingType: true,
  salePrice: true,
  rent: true,
  sourceName: true,
  sourceMetadata: true,
  title: true,
  description: true,
  address: true,
  city: true,
  state: true,
  bedrooms: true,
  bathrooms: true,
  sqft: true,
  status: true,
  availabilityCount: true,
  availabilityStatusSource: true,
  publicationStatus: true,
  publicationStatusSource: true,
  updatedAt: true,
  units: { select: { id: true, beds: true, price: true, available: true } },
  images: { select: { id: true, url: true, altText: true } }
} satisfies Prisma.PropertySelect;

type ActivationProperty = Prisma.PropertyGetPayload<{ select: typeof propertySelect }>;
type PropertyReader = Pick<Prisma.TransactionClient, "property">;
type ActivationStage =
  | "locking"
  | "validation"
  | "property_update"
  | "audit_insertion"
  | "transaction_completion"
  | "post_commit_verification";

export type SaleActivationCandidate = {
  propertyId: string;
  externalId: string;
  salePrice: number;
  currentAvailability: string;
  currentPublicationStatus: string;
  currentAvailabilityProvenance: "UNKNOWN";
  currentPublicationProvenance: string;
  sourceStatus: string | null;
};

export type SaleActivationReport = {
  organizationId: string;
  mode: "DRY_RUN" | "EXECUTED";
  scanned: number;
  approvedScopeSize: number;
  candidateCount: number;
  candidateIdDigest: string;
  previewToken: string;
  scopeMatchesApprovedSet: boolean;
  candidates: SaleActivationCandidate[];
  activatedCount: number;
  skippedCount: number;
  failedCount: number;
  auditEntriesCreated: number;
  auditEntriesVerified: number;
  auditVerified: boolean;
  persistedRecordsVerified: number;
  persistedStateVerified: boolean;
  reason: string;
  activatedAt: string | null;
};

type Snapshot = {
  report: SaleActivationReport;
  records: Map<string, ActivationProperty>;
  fingerprints: Map<string, string>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function sourceListing(property: ActivationProperty): Record<string, unknown> | null {
  return asRecord(asRecord(property.sourceMetadata)?.sourceListing);
}

function sourceListingCategory(value: unknown): "SALE" | "RENT" | "UNKNOWN" {
  if (typeof value !== "string") return "UNKNOWN";
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, " ");
  if (/\b(sale|buy|purchase)\b/.test(normalized)) return "SALE";
  if (/\b(rent|rental|lease)\b/.test(normalized)) return "RENT";
  return "UNKNOWN";
}

function sourceStatusFor(listing: Record<string, unknown> | null): string | null {
  if (!listing) return null;
  const details = asRecord(listing.property_details);
  const title = typeof listing.property_name === "string" ? listing.property_name.trim().toLowerCase() : "";
  const statuses = [
    listing.status,
    listing.status_text,
    listing.marketing_status,
    details?.status,
    details?.status_text,
    details?.marketing_status
  ].filter((status): status is string =>
    typeof status === "string"
    && status.trim().length > 0
    && (!title || status.trim().toLowerCase() !== title)
  );
  return statuses.length > 0 ? statuses.join(" | ") : null;
}

function propertyFingerprint(property: ActivationProperty): string {
  return JSON.stringify({
    ...property,
    units: [...property.units].sort((a, b) => a.id.localeCompare(b.id)),
    images: [...property.images].sort((a, b) => a.id.localeCompare(b.id))
  });
}

function candidateFor(property: ActivationProperty): SaleActivationCandidate | null {
  const listing = sourceListing(property);
  if (
    getPropertyListingCategory(property.listingType) !== "SALE"
    || sourceListingCategory(listing?.listing_type) !== "SALE"
    || property.sourceName !== "Zillow"
    || !listing
    || !(
      typeof listing.property_id === "string" && listing.property_id.trim().length > 0
      || typeof listing.property_id === "number" && Number.isFinite(listing.property_id)
    )
    || property.externalId !== `zillow:${String(listing.property_id)}`
    || !Number.isSafeInteger(property.salePrice)
    || (property.salePrice ?? 0) <= 0
    || normalizeZillowSaleAvailability(listing) !== "AVAILABLE"
    || property.availabilityStatusSource !== "UNKNOWN"
    || property.status !== "UNAVAILABLE"
    || property.publicationStatus !== "PENDING_REVIEW"
    || property.publicationStatusSource === "STAFF"
  ) return null;

  if (getSaleAvailabilityValidationReasons(property).length > 0) return null;
  const evaluation = evaluatePropertyForApproval(
    { ...property, status: "AVAILABLE" },
    { availabilityOverride: "AVAILABLE" }
  );
  if (evaluation.automaticDecision !== "PUBLISHED") return null;

  return {
    propertyId: property.id,
    externalId: property.externalId,
    salePrice: property.salePrice as number,
    currentAvailability: property.status,
    currentPublicationStatus: property.publicationStatus,
    currentAvailabilityProvenance: "UNKNOWN",
    currentPublicationProvenance: property.publicationStatusSource,
    sourceStatus: sourceStatusFor(listing)
  };
}

function candidateIdDigest(ids: string[]): string {
  return createHash("sha256").update([...ids].sort().join("\n")).digest("hex");
}

async function buildSnapshot(
  reader: PropertyReader,
  organizationId: string
): Promise<Snapshot> {
  const records = new Map<string, ActivationProperty>();
  const fingerprints = new Map<string, string>();
  let cursor: string | undefined;

  while (true) {
    const batch = await reader.property.findMany({
      where: { organizationId, ...(cursor ? { id: { gt: cursor } } : {}) },
      orderBy: { id: "asc" },
      take: DEFAULT_BATCH_SIZE,
      select: propertySelect
    });
    if (batch.length === 0) break;
    cursor = batch[batch.length - 1].id;
    for (const property of batch) {
      const fingerprint = propertyFingerprint(property);
      records.set(property.id, property);
      fingerprints.set(property.id, fingerprint);
    }
    if (batch.length < DEFAULT_BATCH_SIZE) break;
  }

  const candidates = [...records.values()]
    .map(candidateFor)
    .filter((candidate): candidate is SaleActivationCandidate => candidate !== null)
    .sort((a, b) => a.propertyId.localeCompare(b.propertyId));
  const ids = candidates.map((candidate) => candidate.propertyId);
  const digest = candidateIdDigest(ids);
  const previewHash = createHash("sha256").update(`property-sale-activation-v1\u0000${organizationId}\u0000${digest}\u0000`);
  for (const id of ids) previewHash.update(`${id}\u0000${fingerprints.get(id)}\u0000`);

  return {
    records,
    fingerprints,
    report: {
      organizationId,
      mode: "DRY_RUN",
      scanned: records.size,
      approvedScopeSize: APPROVED_CANDIDATE_COUNT,
      candidateCount: candidates.length,
      candidateIdDigest: digest,
      previewToken: previewHash.digest("hex"),
      scopeMatchesApprovedSet: candidates.length === APPROVED_CANDIDATE_COUNT
        && digest === APPROVED_SALE_SCOPE_ID_DIGEST,
      candidates,
      activatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      auditEntriesCreated: 0,
      auditEntriesVerified: 0,
      auditVerified: false,
      persistedRecordsVerified: 0,
      persistedStateVerified: false,
      reason: ACTIVATION_REASON,
      activatedAt: null
    }
  };
}

function assertOrganization(organizationId: string): void {
  if (organizationId !== ORGANIZATION_ID) throw new Error("SALE_ACTIVATION_ORGANIZATION_NOT_ALLOWED");
}

function assertApprovedIds(
  ids: string[],
  candidates: SaleActivationCandidate[],
  approvedScopeDigest: string
): void {
  if (
    ids.length !== APPROVED_CANDIDATE_COUNT
    || new Set(ids).size !== ids.length
    || candidateIdDigest(ids) !== approvedScopeDigest
    || candidateIdDigest(candidates.map((candidate) => candidate.propertyId)) !== approvedScopeDigest
  ) throw new Error("SALE_ACTIVATION_SCOPE_MISMATCH");
}

function logActivationFailure(
  stage: ActivationStage,
  error: unknown,
  organizationId: string,
  activationBatchId?: string
): void {
  console.error("[SaleActivation] operation failed", {
    stage,
    organizationId,
    activationBatchId,
    error
  });
}

export async function previewAuthorizedSaleActivation(organizationId: string): Promise<SaleActivationReport> {
  assertOrganization(organizationId);
  return (await buildSnapshot(prisma, organizationId)).report;
}

export async function activateAuthorizedSaleInventory(input: {
  organizationId: string;
  actorUserId: string;
  expectedPreviewToken: string;
  approvedPropertyIds: string[];
  approvedScopeDigest: string;
}): Promise<SaleActivationReport> {
  assertOrganization(input.organizationId);
  if (!input.actorUserId.trim()) throw new Error("SALE_ACTIVATION_ACTOR_REQUIRED");

  let initial: Snapshot;
  try {
    initial = await buildSnapshot(prisma, input.organizationId);
    assertApprovedIds(input.approvedPropertyIds, initial.report.candidates, input.approvedScopeDigest);
    if (initial.report.previewToken !== input.expectedPreviewToken) {
      throw new Error("SALE_ACTIVATION_PREVIEW_STALE");
    }
  } catch (error) {
    logActivationFailure("validation", error, input.organizationId);
    throw error;
  }

  const activationBatchId = randomUUID();
  let failureLogged = false;
  let transactionStage: ActivationStage = "locking";
  let execution: SaleActivationReport;
  try {
    execution = await prisma.$transaction(async (transaction) => {
      try {
        const ids = initial.report.candidates.map((candidate) => candidate.propertyId);
        const idList = Prisma.join(ids);
        const lockedProperties = await transaction.$queryRaw<Array<{ id: string }>>(
          Prisma.sql`SELECT "id" FROM "Property" WHERE "organizationId" = ${input.organizationId} AND "id" IN (${idList}) ORDER BY "id" FOR UPDATE`
        );
        if (lockedProperties.length !== ids.length) throw new Error("SALE_ACTIVATION_PREVIEW_STALE");
        await transaction.$queryRaw(
          Prisma.sql`SELECT "id" FROM "PropertyUnit" WHERE "propertyId" IN (${Prisma.join(ids)}) ORDER BY "propertyId", "id" FOR UPDATE`
        );
        await transaction.$queryRaw(
          Prisma.sql`SELECT "id" FROM "PropertyImage" WHERE "propertyId" IN (${Prisma.join(ids)}) ORDER BY "propertyId", "id" FOR UPDATE`
        );

        transactionStage = "validation";
        const current = await buildSnapshot(transaction, input.organizationId);
        assertApprovedIds(input.approvedPropertyIds, current.report.candidates, input.approvedScopeDigest);
        if (current.report.previewToken !== input.expectedPreviewToken) {
          throw new Error("SALE_ACTIVATION_PREVIEW_STALE");
        }

        const activatedAt = new Date();
        const auditEntries = current.report.candidates.map((candidate) => {
          const property = current.records.get(candidate.propertyId);
          const fingerprint = current.fingerprints.get(candidate.propertyId);
          if (!property || !fingerprint || fingerprint !== initial.fingerprints.get(candidate.propertyId)) {
            throw new Error("SALE_ACTIVATION_PREVIEW_STALE");
          }

          return {
            userId: input.actorUserId,
            entity: "Property",
            action: "staff_sale_inventory_activated",
            createdAt: activatedAt,
            meta: {
              organizationId: input.organizationId,
              activationBatchId,
              propertyId: property.id,
              externalId: property.externalId,
              timestamp: activatedAt.toISOString(),
              reason: ACTIVATION_REASON,
              previewToken: input.expectedPreviewToken,
              previousValues: {
                status: property.status,
                publicationStatus: property.publicationStatus,
                availabilityStatusSource: property.availabilityStatusSource,
                publicationStatusSource: property.publicationStatusSource
              },
              newValues: {
                status: "AVAILABLE",
                publicationStatus: "PUBLISHED",
                availabilityStatusSource: "STAFF",
                publicationStatusSource: "STAFF"
              }
            }
          };
        });

        transactionStage = "property_update";
        const conditionalCandidates = current.report.candidates.map((candidate) => {
          const property = current.records.get(candidate.propertyId);
          if (!property) throw new Error("SALE_ACTIVATION_PREVIEW_STALE");
          return {
            id: property.id,
            organizationId: input.organizationId,
            externalId: property.externalId,
            sourceName: "Zillow",
            listingType: property.listingType,
            salePrice: property.salePrice,
            status: property.status,
            publicationStatus: property.publicationStatus,
            publicationStatusSource: property.publicationStatusSource,
            availabilityStatusSource: candidate.currentAvailabilityProvenance,
            updatedAt: property.updatedAt
          };
        });
        const updated = await transaction.property.updateMany({
          where: { OR: conditionalCandidates },
          data: {
            status: "AVAILABLE",
            publicationStatus: "PUBLISHED",
            availabilityStatusSource: "STAFF",
            publicationStatusSource: "STAFF"
          }
        });
        if (updated.count !== current.report.candidates.length) {
          throw new Error("SALE_ACTIVATION_PREVIEW_STALE");
        }

        transactionStage = "audit_insertion";
        const audited = await transaction.auditLog.createMany({ data: auditEntries });
        if (audited.count !== current.report.candidates.length) {
          throw new Error("SALE_ACTIVATION_AUDIT_COUNT_MISMATCH");
        }

        return {
          ...current.report,
          mode: "EXECUTED" as const,
          activatedCount: current.report.candidates.length,
          auditEntriesCreated: audited.count,
          activatedAt: activatedAt.toISOString()
        };
      } catch (error) {
        logActivationFailure(transactionStage, error, input.organizationId, activationBatchId);
        failureLogged = true;
        throw error;
      }
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 60000
    });
  } catch (error) {
    if (!failureLogged) {
      logActivationFailure("transaction_completion", error, input.organizationId, activationBatchId);
    }
    throw error;
  }

  try {
    const auditEntries = await prisma.auditLog.findMany({
      where: {
        userId: input.actorUserId,
        entity: "Property",
        action: "staff_sale_inventory_activated",
        createdAt: execution.activatedAt ? new Date(execution.activatedAt) : undefined
      },
      select: { meta: true }
    });
    const auditEntriesVerified = auditEntries.filter((entry) =>
      asRecord(entry.meta)?.activationBatchId === activationBatchId
    ).length;
    const auditVerified = auditEntriesVerified === execution.activatedCount;
    const persistedRecords = await prisma.property.findMany({
      where: {
        organizationId: input.organizationId,
        id: { in: execution.candidates.map((candidate) => candidate.propertyId) }
      },
      select: {
        status: true,
        publicationStatus: true,
        availabilityStatusSource: true,
        publicationStatusSource: true
      }
    });
    const persistedRecordsVerified = persistedRecords.filter((property) =>
      property.status === "AVAILABLE"
      && property.publicationStatus === "PUBLISHED"
      && property.availabilityStatusSource === "STAFF"
      && property.publicationStatusSource === "STAFF"
    ).length;
    const persistedStateVerified = persistedRecords.length === execution.activatedCount
      && persistedRecordsVerified === execution.activatedCount;

    if (!auditVerified || !persistedStateVerified) {
      logActivationFailure(
        "post_commit_verification",
        new Error(
          `Committed activation verification failed: ${auditEntriesVerified}/${execution.activatedCount} audits and ${persistedRecordsVerified}/${execution.activatedCount} properties verified`
        ),
        input.organizationId,
        activationBatchId
      );
    }

    return {
      ...execution,
      auditEntriesVerified,
      auditVerified,
      persistedRecordsVerified,
      persistedStateVerified,
      failedCount: auditVerified && persistedStateVerified ? execution.failedCount : 1
    };
  } catch (error) {
    logActivationFailure("post_commit_verification", error, input.organizationId, activationBatchId);
    throw error;
  }
}
