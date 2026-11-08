import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma/client";
import { getPropertyListingCategory } from "@/lib/properties/listing-category";
import {
  evaluatePropertyForApproval,
  getSaleAvailabilityValidationReasons,
  isPropertyPublicationStatus
} from "@/lib/properties/property-review.service";
import {
  hasZillowSpecialSaleStatus,
  normalizeZillowRentalAvailability,
  normalizeZillowSaleAvailability
} from "@/lib/properties/zillow-listing-status";

const DEFAULT_BATCH_SIZE = 200;
const MAX_BATCH_SIZE = 500;

const propertySelect = {
  id: true,
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
  images: { select: { url: true } }
} as const;

type ReconciliationProperty = {
  id: string;
  externalId: string | null;
  listingType: string | null;
  salePrice: number | null;
  rent: number;
  sourceName: string | null;
  sourceMetadata: unknown;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  status: string;
  availabilityCount: number;
  availabilityStatusSource: "AUTOMATIC" | "STAFF" | "UNKNOWN";
  publicationStatus: string;
  publicationStatusSource: string;
  updatedAt: Date;
  units: Array<{ id: string; beds: number; price: number; available: boolean }>;
  images: Array<{ url: string }>;
};

export type PropertyReconciliationOptions = {
  organizationId: string;
  dryRun: boolean;
  batchSize?: number;
  expectedPreviewToken?: string;
};

export type ReconciliationCandidate = {
  id: string;
  title: string;
  listingCategory: "SALE" | "RENT" | "UNKNOWN";
  currentAvailability: string;
  availabilityStatusSource: "AUTOMATIC" | "STAFF" | "UNKNOWN";
  proposedAvailability: string;
  currentPublicationStatus: string;
  proposedPublicationStatus: string;
  sourceStatus: string | null;
  action: "AVAILABILITY" | "PUBLICATION" | "AVAILABILITY_AND_PUBLICATION" | "REVIEW";
  specialReview: boolean;
  reasons: string[];
  eligibleForAvailabilityCorrection: boolean;
  eligibleForPublication: boolean;
};

export type PropertyReconciliationReport = {
  organizationId: string;
  mode: "DRY_RUN" | "EXECUTED";
  previewToken: string;
  scanned: number;
  eligibleForAvailabilityCorrection: number;
  eligibleForPublication: number;
  staffAvailabilityDecision: number;
  unknownAvailabilityDecision: number;
  remainUnavailable: number;
  needsMissingInformation: number;
  uncertainSourceStatus: number;
  confirmedInactive: number;
  unknownListingCategory: number;
  specialListingReview: number;
  unchanged: number;
  appliedAvailabilityChanges: number;
  appliedPublicationChanges: number;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
  reasonCounts: Record<string, number>;
  candidates: ReconciliationCandidate[];
  errors: Array<{ propertyId: string; message: string }>;
};

type PreviewSnapshot = {
  report: PropertyReconciliationReport;
  fingerprints: Map<string, string>;
  records: Map<string, ReconciliationProperty>;
};

function sourceListingFor(property: ReconciliationProperty): Record<string, unknown> | null {
  const metadata = property.sourceMetadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const listing = (metadata as Record<string, unknown>).sourceListing;
  return listing && typeof listing === "object" && !Array.isArray(listing)
    ? listing as Record<string, unknown>
    : null;
}

function sourceStatusFor(listing: Record<string, unknown> | null): string | null {
  if (!listing) return null;
  const details = listing.property_details;
  const propertyDetails = details && typeof details === "object" && !Array.isArray(details)
    ? details as Record<string, unknown>
    : null;
  const listingTitle = typeof listing.property_name === "string" ? listing.property_name.trim().toLowerCase() : "";
  const statuses = [
    listing.status,
    listing.status_text,
    listing.marketing_status,
    propertyDetails?.status,
    propertyDetails?.status_text,
    propertyDetails?.marketing_status
  ].filter((status): status is string =>
    typeof status === "string"
    && status.trim().length > 0
    && (!listingTitle || status.trim().toLowerCase() !== listingTitle)
  );
  return statuses.length > 0 ? statuses.join(" | ") : null;
}

function isValidAvailableUnit(unit: ReconciliationProperty["units"][number]): boolean {
  return unit.available
    && Number.isInteger(unit.beds)
    && unit.beds >= 0
    && Number.isSafeInteger(unit.price)
    && unit.price > 0;
}

function hasTrustedZillowIdentity(property: ReconciliationProperty, listing: Record<string, unknown> | null): boolean {
  if (
    property.sourceName !== "Zillow"
    || !property.externalId?.startsWith("zillow:")
    || !listing
    || (typeof listing.property_id !== "string" && typeof listing.property_id !== "number")
  ) return false;
  return property.externalId === `zillow:${String(listing.property_id)}`;
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

function propertyFingerprint(property: ReconciliationProperty): string {
  return JSON.stringify({
    ...property,
    units: [...property.units].sort((a, b) => a.id.localeCompare(b.id)),
    images: [...property.images].sort((a, b) => a.url.localeCompare(b.url))
  });
}

function reviewReasons(
  property: ReconciliationProperty,
  projectedStatus: string,
  listing: Record<string, unknown> | null
) {
  const category = getPropertyListingCategory(property.listingType);
  return evaluatePropertyForApproval({
    externalId: property.externalId,
    listingType: property.listingType,
    salePrice: property.salePrice,
    rent: property.rent,
    title: property.title,
    description: property.description,
    address: property.address,
    city: property.city,
    state: property.state,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft,
    sourceName: property.sourceName,
    sourceMetadata: property.sourceMetadata,
    status: projectedStatus,
    units: property.units,
    images: property.images
  }, {
    staffManaged: property.publicationStatusSource === "STAFF"
      || property.publicationStatus === "REJECTED"
      || property.publicationStatus === "APPROVED_UNPUBLISHED",
    staffManagedStatus: isPropertyPublicationStatus(property.publicationStatus)
      ? property.publicationStatus
      : null,
    availabilityOverride: listing
      ? category === "SALE"
        ? normalizeZillowSaleAvailability(listing)
        : category === "RENT"
          ? normalizeZillowRentalAvailability(listing)
          : "UNCERTAIN"
      : "UNCERTAIN"
  });
}

function createReport(organizationId: string, mode: "DRY_RUN" | "EXECUTED"): PropertyReconciliationReport {
  return {
    organizationId,
    mode,
    previewToken: "",
    scanned: 0,
    eligibleForAvailabilityCorrection: 0,
    eligibleForPublication: 0,
    staffAvailabilityDecision: 0,
    unknownAvailabilityDecision: 0,
    remainUnavailable: 0,
    needsMissingInformation: 0,
    uncertainSourceStatus: 0,
    confirmedInactive: 0,
    unknownListingCategory: 0,
    specialListingReview: 0,
    unchanged: 0,
    appliedAvailabilityChanges: 0,
    appliedPublicationChanges: 0,
    appliedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    reasonCounts: {},
    candidates: [],
    errors: []
  };
}

async function buildPreview(organizationId: string, batchSize: number): Promise<PreviewSnapshot> {
  const report = createReport(organizationId, "DRY_RUN");
  const hash = createHash("sha256").update(`property-reconciliation-v1\u0000${organizationId}\u0000`);
  const fingerprints = new Map<string, string>();
  const records = new Map<string, ReconciliationProperty>();
  let cursor: string | undefined;

  while (true) {
    const batch = await prisma.property.findMany({
      where: {
        organizationId,
        ...(cursor ? { id: { gt: cursor } } : {})
      },
      orderBy: { id: "asc" },
      take: batchSize,
      select: propertySelect
    }) as ReconciliationProperty[];
    if (batch.length === 0) break;
    cursor = batch[batch.length - 1].id;

    for (const property of batch) {
      report.scanned++;
      const fingerprint = propertyFingerprint(property);
      hash.update(`${property.id}\u0000${fingerprint}\u0000`);
      fingerprints.set(property.id, fingerprint);
      records.set(property.id, property);
      const category = getPropertyListingCategory(property.listingType);
      const listing = sourceListingFor(property);
      const listingCategory = category ?? "UNKNOWN";
      const sourceStatus = sourceStatusFor(listing);
      const specialReview = category === "SALE" && hasZillowSpecialSaleStatus(listing);
      const reasons: string[] = [];
      const availabilitySourceAutomatic = property.availabilityStatusSource === "AUTOMATIC";
      let sourceAvailability: "AVAILABLE" | "UNAVAILABLE" | "UNCERTAIN" = "UNCERTAIN";
      let projectedStatus = property.status;
      let projectedPublicationStatus = property.publicationStatus;
      let canBeAvailable = false;
      let eligibleForAvailabilityCorrection = false;
      let eligibleForPublication = false;

      if (!category) {
        report.unknownListingCategory++;
        reasons.push("listing_type_missing_or_unsupported");
        report.needsMissingInformation++;
      } else if (!hasTrustedZillowIdentity(property, listing)) {
        reasons.push("trusted_source_identity_missing");
      } else {
        if (property.availabilityStatusSource === "STAFF") {
          report.staffAvailabilityDecision++;
          reasons.push("availability_decision_staff_managed");
        } else if (property.availabilityStatusSource === "UNKNOWN") {
          report.unknownAvailabilityDecision++;
          reasons.push("availability_decision_origin_unknown");
        }
        sourceAvailability = category === "SALE"
          ? normalizeZillowSaleAvailability(listing)
          : normalizeZillowRentalAvailability(listing);
        const salePriceValid = Number.isSafeInteger(property.salePrice) && (property.salePrice ?? 0) > 0;
        const rentValid = Number.isSafeInteger(property.rent) && property.rent > 0;
        const availableUnits = property.units.filter(isValidAvailableUnit);
        const rentalReady = rentValid && availableUnits.length > 0;
        canBeAvailable = sourceAvailability === "AVAILABLE"
          && (category === "SALE"
            ? salePriceValid && getSaleAvailabilityValidationReasons(property).length === 0
            : rentalReady);
        projectedStatus = specialReview || !availabilitySourceAutomatic
          ? property.status
          : canBeAvailable ? "AVAILABLE" : "UNAVAILABLE";
        const evaluation = reviewReasons(property, projectedStatus, listing);
        const hasMissingInformation = evaluation.reasons.some((reason) => ![
          "availability_not_confirmed",
          "availability_status_conflicts_with_source",
          "listing_confirmed_unavailable"
        ].includes(reason));
        const isStaffManaged = property.publicationStatusSource === "STAFF"
          || property.publicationStatus === "REJECTED"
          || property.publicationStatus === "APPROVED_UNPUBLISHED";
        const canPublish = availabilitySourceAutomatic
          && canBeAvailable
          && evaluation.automaticDecision === "PUBLISHED"
          && !isStaffManaged;

        eligibleForAvailabilityCorrection = availabilitySourceAutomatic
          && !specialReview
          && (canBeAvailable
          ? property.status !== "AVAILABLE"
          : property.status !== "UNAVAILABLE");
        eligibleForPublication = canPublish && property.publicationStatus !== "PUBLISHED";
        if (eligibleForPublication) projectedPublicationStatus = "PUBLISHED";
        if (sourceAvailability === "UNAVAILABLE") report.confirmedInactive++;
        if (sourceAvailability === "UNCERTAIN") report.uncertainSourceStatus++;
        if (projectedStatus !== "AVAILABLE") report.remainUnavailable++;
        if (hasMissingInformation) report.needsMissingInformation++;
        reasons.push(...evaluation.reasons.filter((reason) =>
          reason !== "availability_status_conflicts_with_source"
        ));
        if (specialReview) reasons.push("special_sale_listing_requires_individual_review");
      }

      if (specialReview) report.specialListingReview++;
      if (eligibleForAvailabilityCorrection) report.eligibleForAvailabilityCorrection++;
      if (eligibleForPublication) report.eligibleForPublication++;

      const uniqueReasons = [...new Set(reasons)];
      for (const reason of uniqueReasons) increment(report.reasonCounts, reason);
      const hasProposedChange = eligibleForAvailabilityCorrection || eligibleForPublication;
      if (!hasProposedChange && uniqueReasons.length === 0) report.unchanged++;
      if (hasProposedChange || uniqueReasons.length > 0) {
        const action = eligibleForAvailabilityCorrection && eligibleForPublication
          ? "AVAILABILITY_AND_PUBLICATION"
          : eligibleForAvailabilityCorrection
            ? "AVAILABILITY"
            : eligibleForPublication
              ? "PUBLICATION"
              : "REVIEW";
        report.candidates.push({
          id: property.id,
          title: property.title,
          listingCategory,
          currentAvailability: property.status,
          availabilityStatusSource: property.availabilityStatusSource,
          proposedAvailability: projectedStatus,
          currentPublicationStatus: property.publicationStatus,
          proposedPublicationStatus: projectedPublicationStatus,
          sourceStatus,
          action,
          specialReview,
          reasons: uniqueReasons,
          eligibleForAvailabilityCorrection,
          eligibleForPublication
        });
      }

      if (category && !hasTrustedZillowIdentity(property, listing)) {
        report.needsMissingInformation++;
        if (property.status !== "AVAILABLE") report.remainUnavailable++;
      }
    }

    if (batch.length < batchSize) break;
  }

  report.previewToken = hash.digest("hex");
  return { report, fingerprints, records };
}

export async function reconcileImportedProperties(
  options: PropertyReconciliationOptions
): Promise<PropertyReconciliationReport> {
  if (!options.organizationId.trim()) throw new Error("organizationId is required");
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE) {
    throw new Error(`batchSize must be between 1 and ${MAX_BATCH_SIZE}`);
  }

  const snapshot = await buildPreview(options.organizationId, batchSize);
  if (options.dryRun) return snapshot.report;
  if (!options.expectedPreviewToken) {
    throw new Error("A fresh preview token is required to execute reconciliation");
  }
  if (snapshot.report.previewToken !== options.expectedPreviewToken) {
    throw new Error("Property data changed since preview; run a new preview before execution");
  }

  const report = { ...snapshot.report, mode: "EXECUTED" as const };
  for (const candidate of report.candidates) {
    if (!candidate.eligibleForAvailabilityCorrection && !candidate.eligibleForPublication) continue;
    const expectedFingerprint = snapshot.fingerprints.get(candidate.id);
    const scannedRecord = snapshot.records.get(candidate.id);
    if (!expectedFingerprint || !scannedRecord) {
      report.failedCount++;
      report.errors.push({ propertyId: candidate.id, message: "Preview snapshot is incomplete; no update was applied" });
      continue;
    }

    try {
      const current = await prisma.property.findFirst({
        where: { id: candidate.id, organizationId: options.organizationId },
        select: propertySelect
      }) as ReconciliationProperty | null;
      if (!current || propertyFingerprint(current) !== expectedFingerprint) {
        report.skippedCount++;
        continue;
      }

      const data: Record<string, unknown> = {};
      if (candidate.eligibleForAvailabilityCorrection) {
        data.status = candidate.proposedAvailability;
        const category = getPropertyListingCategory(current.listingType);
        data.availabilityCount = category === "RENT" && candidate.proposedAvailability === "AVAILABLE"
          ? current.units.filter(isValidAvailableUnit).length
          : 0;
      }
      if (candidate.eligibleForPublication) data.publicationStatus = candidate.proposedPublicationStatus;

      const updated = await prisma.property.updateMany({
        where: {
          id: current.id,
          organizationId: options.organizationId,
          externalId: current.externalId,
          sourceName: "Zillow",
          status: current.status,
          publicationStatus: current.publicationStatus,
          publicationStatusSource: current.publicationStatusSource,
          availabilityStatusSource: "AUTOMATIC",
          updatedAt: current.updatedAt
        },
        data
      });
      if (updated.count !== 1) {
        report.skippedCount++;
        continue;
      }
      report.appliedCount++;
      if (candidate.eligibleForAvailabilityCorrection) report.appliedAvailabilityChanges++;
      if (candidate.eligibleForPublication) report.appliedPublicationChanges++;
    } catch (error) {
      report.failedCount++;
      report.errors.push({
        propertyId: candidate.id,
        message: error instanceof Error ? error.message : "Unable to update property"
      });
    }
  }
  return report;
}
