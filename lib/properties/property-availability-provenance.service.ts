import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { getPropertyListingCategory } from "@/lib/properties/listing-category";
import { getSaleAvailabilityValidationReasons } from "@/lib/properties/property-review.service";
import { normalizeZillowRentalAvailability, normalizeZillowSaleAvailability } from "@/lib/properties/zillow-listing-status";

const reviewSelect = {
  id: true,
  organizationId: true,
  title: true,
  description: true,
  address: true,
  city: true,
  state: true,
  externalId: true,
  sourceName: true,
  sourceStatus: true,
  sourceMetadata: true,
  listingType: true,
  status: true,
  availabilityCount: true,
  availabilityStatusSource: true,
  publicationStatus: true,
  rent: true,
  salePrice: true,
  bedrooms: true,
  bathrooms: true,
  sqft: true,
  updatedAt: true,
  units: { select: { id: true, beds: true, price: true, available: true } },
  images: { select: { url: true } }
} as const;

type ProvenanceReviewProperty = {
  id: string;
  organizationId: string | null;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  externalId: string | null;
  sourceName: string | null;
  sourceStatus: string | null;
  sourceMetadata: unknown;
  listingType: string | null;
  status: string;
  availabilityCount: number;
  availabilityStatusSource: "AUTOMATIC" | "STAFF" | "UNKNOWN";
  publicationStatus: string;
  rent: number;
  salePrice: number | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  updatedAt: Date;
  units: Array<{ id: string; beds: number; price: number; available: boolean }>;
  images: Array<{ url: string }>;
};

export type ProvenanceEvidenceCategory = "STRONG_AUTOMATIC_EVIDENCE" | "STAFF_REVIEW_REQUIRED" | "NOT_ELIGIBLE_FOR_AUTOMATIC_APPROVAL";
export type ProvenanceApprovalDecision = "AUTOMATIC" | "STAFF";

export type ProvenanceReviewCandidate = {
  id: string;
  title: string;
  description: string;
  address: string;
  externalId: string | null;
  sourceName: string | null;
  sourceIdentityValid: boolean;
  listingType: string | null;
  listingCategory: "RENT" | "SALE" | "UNKNOWN";
  availabilityStatusSource: "AUTOMATIC" | "STAFF" | "UNKNOWN";
  currentAvailability: string;
  availabilityCount: number;
  publicationStatus: string;
  sourceStatus: string | null;
  sourceStatusText: string | null;
  sourceMarketingStatus: string | null;
  sourcePropertyDetailsStatus: string | null;
  sourcePropertyDetailsStatusText: string | null;
  sourcePropertyDetailsMarketingStatus: string | null;
  normalizedSourceAvailability: "AVAILABLE" | "UNAVAILABLE" | "UNCERTAIN";
  rent: number;
  salePrice: number | null;
  rentalUnits: Array<{ beds: number; price: number; available: boolean }>;
  imageUrls: string[];
  missingOrInvalidInformation: string[];
  evidenceCategory: ProvenanceEvidenceCategory;
  automaticApprovalEligible: boolean;
  evidence: string[];
  reviewReasons: string[];
  evidenceToken: string;
};

export type ProvenanceReviewReport = {
  organizationId: string;
  generatedAt: string;
  totalUnknown: number;
  categories: {
    strongAutomaticEvidence: number;
    staffReviewRequired: number;
    notEligibleForAutomaticApproval: number;
  };
  listingCategories: {
    rental: number;
    sale: number;
    unknown: number;
  };
  currentAvailability: Record<string, number>;
  publicationStatus: Record<string, number>;
  candidates: ProvenanceReviewCandidate[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function sourceListingFor(property: ProvenanceReviewProperty): Record<string, unknown> | null {
  return asRecord(asRecord(property.sourceMetadata)?.sourceListing);
}

function sourceIdentity(property: ProvenanceReviewProperty, listing: Record<string, unknown> | null): boolean {
  return property.sourceName === "Zillow"
    && Boolean(listing)
    && (typeof listing?.property_id === "string" || typeof listing?.property_id === "number")
    && property.externalId === `zillow:${String(listing?.property_id)}`;
}

function isValidUnit(unit: ProvenanceReviewProperty["units"][number]): boolean {
  return unit.available
    && Number.isInteger(unit.beds)
    && unit.beds >= 0
    && Number.isSafeInteger(unit.price)
    && unit.price > 0;
}

function fingerprint(property: ProvenanceReviewProperty): string {
  return createHash("sha256").update(JSON.stringify({
    id: property.id,
    organizationId: property.organizationId,
    title: property.title,
    description: property.description,
    address: property.address,
    externalId: property.externalId,
    sourceName: property.sourceName,
    sourceStatus: property.sourceStatus,
    sourceMetadata: property.sourceMetadata,
    listingType: property.listingType,
    status: property.status,
    availabilityCount: property.availabilityCount,
    availabilityStatusSource: property.availabilityStatusSource,
    publicationStatus: property.publicationStatus,
    rent: property.rent,
    salePrice: property.salePrice,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft,
    updatedAt: property.updatedAt,
    units: [...property.units].sort((a, b) => a.id.localeCompare(b.id)),
    images: [...property.images].sort((a, b) => a.url.localeCompare(b.url))
  })).digest("hex");
}

function classifyEvidence(property: ProvenanceReviewProperty, listing: Record<string, unknown> | null) {
  const metadata = asRecord(property.sourceMetadata);
  const marker = asRecord(metadata?.helociAvailabilityDecision);
  const category = getPropertyListingCategory(property.listingType);
  const identityValid = sourceIdentity(property, listing);
  const normalizedSourceAvailability = category === "SALE"
    ? normalizeZillowSaleAvailability(listing)
    : category === "RENT"
      ? normalizeZillowRentalAvailability(listing)
      : "UNCERTAIN";
  const validPrice = category === "SALE"
    ? Number.isSafeInteger(property.salePrice) && (property.salePrice ?? 0) > 0
    : category === "RENT"
      ? Number.isSafeInteger(property.rent) && property.rent > 0
      : false;
  const validRentalUnits = category !== "RENT" || property.units.some(isValidUnit);
  const saleValidationReasons = category === "SALE"
    ? getSaleAvailabilityValidationReasons(property)
    : [];
  const evidence: string[] = [];
  const reviewReasons: string[] = [];
  const missingOrInvalidInformation: string[] = [];
  if (category === "RENT" && !validPrice) missingOrInvalidInformation.push("valid rental price missing");
  if (category === "SALE" && !validPrice) missingOrInvalidInformation.push("valid sale price missing");
  if (category === "RENT" && !validRentalUnits) missingOrInvalidInformation.push("valid available rental unit missing");
  if (!property.title.trim() || saleValidationReasons.includes("title_missing_or_placeholder")) missingOrInvalidInformation.push("title missing or placeholder");
  if (!property.address.trim() || saleValidationReasons.includes("address_incomplete")) missingOrInvalidInformation.push("address missing");
  if (saleValidationReasons.includes("description_missing_or_placeholder")) missingOrInvalidInformation.push("meaningful property description missing");
  if (category === "RENT") {
    if (!Number.isInteger(property.bedrooms) || property.bedrooms < 0) missingOrInvalidInformation.push("bedrooms missing or invalid");
    if (!Number.isFinite(property.bathrooms) || property.bathrooms <= 0) missingOrInvalidInformation.push("bathrooms missing or invalid");
    if (!Number.isFinite(property.sqft) || property.sqft <= 0) missingOrInvalidInformation.push("living area missing or invalid");
  }
  if (property.images.length === 0 || property.images.every((image) => !image.url.trim()) || saleValidationReasons.includes("property_image_missing")) missingOrInvalidInformation.push("usable property image missing");
  const markerMatches = marker?.version === 1
    && marker.source === "AUTOMATIC"
    && marker.status === property.status;
  let evidenceCategory: ProvenanceEvidenceCategory = "STAFF_REVIEW_REQUIRED";

  if (!identityValid && (property.sourceName === "Zillow" || property.externalId?.startsWith("zillow:"))) {
    evidenceCategory = "NOT_ELIGIBLE_FOR_AUTOMATIC_APPROVAL";
    reviewReasons.push("Zillow source identity is missing or conflicts with the external ID.");
  } else if (!category) {
    evidenceCategory = "NOT_ELIGIBLE_FOR_AUTOMATIC_APPROVAL";
    reviewReasons.push("Listing category is missing or unsupported.");
  } else if (!validPrice) {
    evidenceCategory = "NOT_ELIGIBLE_FOR_AUTOMATIC_APPROVAL";
    reviewReasons.push(category === "SALE" ? "Sale price is missing or invalid." : "Rental price is missing or invalid.");
  } else if (!validRentalUnits) {
    evidenceCategory = "NOT_ELIGIBLE_FOR_AUTOMATIC_APPROVAL";
    reviewReasons.push("No valid available rental unit is persisted.");
  } else if (category === "SALE" && saleValidationReasons.length > 0) {
    evidenceCategory = "NOT_ELIGIBLE_FOR_AUTOMATIC_APPROVAL";
    reviewReasons.push("Sale listing is missing required price, identity, title, address, details, or usable image information.");
  } else if (normalizedSourceAvailability === "UNCERTAIN") {
    evidenceCategory = "STAFF_REVIEW_REQUIRED";
    reviewReasons.push("Persisted Zillow status fields do not establish active or inactive availability.");
  } else if (!markerMatches || !identityValid) {
    evidenceCategory = "STAFF_REVIEW_REQUIRED";
    reviewReasons.push("No trusted importer-generated availability decision marker matches the current status.");
  } else {
    evidenceCategory = "STRONG_AUTOMATIC_EVIDENCE";
    evidence.push("HELOCI importer decision marker is version 1 and matches the current availability status.");
    evidence.push("Zillow source identity matches the persisted external ID.");
    evidence.push("Required category-specific price data is valid.");
    if (category === "RENT") evidence.push("At least one valid available rental unit is persisted.");
  }

  if (identityValid) evidence.push("Zillow property ID matches the external ID.");
  if (markerMatches) evidence.push("Importer-generated decision marker matches the current status.");
  if (normalizedSourceAvailability !== "UNCERTAIN") {
    evidence.push(`Source status normalizes to ${normalizedSourceAvailability}; this is source-status evidence only, not provenance evidence.`);
  }
  if (listing?.marketing_status || asRecord(listing?.property_details)?.marketing_status) {
    evidence.push("Marketing status is displayed for review only and does not establish HELOCI availability provenance.");
  }
  if (category === "RENT" && !validRentalUnits) reviewReasons.push("Rental unit data is missing or invalid.");
  if (!identityValid && evidenceCategory === "STAFF_REVIEW_REQUIRED") {
    reviewReasons.push("A trusted Zillow source identity was not established.");
  }
  if (evidenceCategory !== "STRONG_AUTOMATIC_EVIDENCE" && reviewReasons.length === 0) {
    reviewReasons.push("Historical data does not establish who or what set the current availability status.");
  }

  const reportCategory: ProvenanceReviewCandidate["listingCategory"] = category ?? "UNKNOWN";
  return {
    category: reportCategory,
    identityValid,
    normalizedSourceAvailability,
    evidenceCategory,
    automaticApprovalEligible: evidenceCategory === "STRONG_AUTOMATIC_EVIDENCE",
    evidence,
    reviewReasons,
    missingOrInvalidInformation
  };
}

function candidateFor(property: ProvenanceReviewProperty): ProvenanceReviewCandidate {
  const listing = sourceListingFor(property);
  const details = asRecord(listing?.property_details);
  const assessment = classifyEvidence(property, listing);
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    address: property.address,
    externalId: property.externalId,
    sourceName: property.sourceName,
    sourceIdentityValid: assessment.identityValid,
    listingType: property.listingType,
    listingCategory: assessment.category,
    availabilityStatusSource: property.availabilityStatusSource,
    currentAvailability: property.status,
    availabilityCount: property.availabilityCount,
    publicationStatus: property.publicationStatus,
    sourceStatus: typeof listing?.status === "string" ? listing.status : null,
    sourceStatusText: typeof listing?.status_text === "string" ? listing.status_text : null,
    sourceMarketingStatus: typeof listing?.marketing_status === "string" ? listing.marketing_status : null,
    sourcePropertyDetailsStatus: typeof details?.status === "string" ? details.status : null,
    sourcePropertyDetailsStatusText: typeof details?.status_text === "string" ? details.status_text : null,
    sourcePropertyDetailsMarketingStatus: typeof details?.marketing_status === "string" ? details.marketing_status : null,
    normalizedSourceAvailability: assessment.normalizedSourceAvailability,
    rent: property.rent,
    salePrice: property.salePrice,
    rentalUnits: property.units.map(({ beds, price, available }) => ({ beds, price, available })),
    imageUrls: property.images.map(({ url }) => url),
    missingOrInvalidInformation: assessment.missingOrInvalidInformation,
    evidenceCategory: assessment.evidenceCategory,
    automaticApprovalEligible: assessment.automaticApprovalEligible,
    evidence: assessment.evidence,
    reviewReasons: assessment.reviewReasons,
    evidenceToken: fingerprint(property)
  };
}

export async function getUnknownAvailabilityProvenanceReport(organizationId: string): Promise<ProvenanceReviewReport> {
  const properties = await prisma.property.findMany({
    where: { organizationId, availabilityStatusSource: "UNKNOWN" },
    orderBy: { id: "asc" },
    select: {
      ...reviewSelect
    }
  }) as ProvenanceReviewProperty[];
  const report: ProvenanceReviewReport = {
    organizationId,
    generatedAt: new Date().toISOString(),
    totalUnknown: properties.length,
    categories: { strongAutomaticEvidence: 0, staffReviewRequired: 0, notEligibleForAutomaticApproval: 0 },
    listingCategories: { rental: 0, sale: 0, unknown: 0 },
    currentAvailability: {},
    publicationStatus: {},
    candidates: []
  };

  for (const property of properties) {
    const candidate = candidateFor(property);
    if (candidate.evidenceCategory === "STRONG_AUTOMATIC_EVIDENCE") report.categories.strongAutomaticEvidence++;
    else if (candidate.evidenceCategory === "STAFF_REVIEW_REQUIRED") report.categories.staffReviewRequired++;
    else report.categories.notEligibleForAutomaticApproval++;
    if (candidate.listingCategory === "RENT") report.listingCategories.rental++;
    else if (candidate.listingCategory === "SALE") report.listingCategories.sale++;
    else report.listingCategories.unknown++;
    report.currentAvailability[property.status] = (report.currentAvailability[property.status] ?? 0) + 1;
    report.publicationStatus[property.publicationStatus] = (report.publicationStatus[property.publicationStatus] ?? 0) + 1;
    report.candidates.push(candidate);
  }
  return report;
}

export async function approveUnknownAvailabilityProvenance(input: {
  organizationId: string;
  propertyId: string;
  actorUserId: string;
  decision: ProvenanceApprovalDecision;
  reason: string;
  confirmIntentionalAvailability?: boolean;
  expectedEvidenceToken: string;
}) {
  const reason = input.reason.trim();
  if (reason.length < 12) throw new Error("APPROVAL_REASON_TOO_SHORT");
  if (reason.length > 1000) throw new Error("APPROVAL_REASON_TOO_LONG");
  if (!input.organizationId.trim() || !input.propertyId.trim()) throw new Error("INVALID_APPROVAL_TARGET");
  if (input.decision !== "AUTOMATIC" && input.decision !== "STAFF") throw new Error("INVALID_PROVENANCE_DECISION");
  if (input.decision === "STAFF" && input.confirmIntentionalAvailability !== true) {
    throw new Error("STAFF_INTENT_CONFIRMATION_REQUIRED");
  }

  const where = {
    id: input.propertyId,
    organizationId: input.organizationId,
    availabilityStatusSource: "UNKNOWN" as const
  };
  const initial = await prisma.property.findFirst({
    where,
    select: reviewSelect
  }) as ProvenanceReviewProperty | null;
  if (!initial) throw new Error("PROVENANCE_NOT_UNKNOWN_OR_NOT_FOUND");
  const initialCandidate = candidateFor(initial);
  if (fingerprint(initial) !== input.expectedEvidenceToken) throw new Error("PROVENANCE_EVIDENCE_STALE");
  if (input.decision === "AUTOMATIC" && !initialCandidate.automaticApprovalEligible) {
    throw new Error("AUTOMATIC_PROVENANCE_EVIDENCE_INSUFFICIENT");
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT "id" FROM "Property" WHERE "id" = ${input.propertyId} AND "organizationId" = ${input.organizationId} FOR UPDATE`;
    await transaction.$queryRaw`SELECT "id" FROM "PropertyUnit" WHERE "propertyId" = ${input.propertyId} FOR UPDATE`;
    await transaction.$queryRaw`SELECT "id" FROM "PropertyImage" WHERE "propertyId" = ${input.propertyId} FOR UPDATE`;
    const current = await transaction.property.findFirst({
      where,
      select: reviewSelect
    }) as ProvenanceReviewProperty | null;
    if (!current) throw new Error("PROVENANCE_NOT_UNKNOWN_OR_NOT_FOUND");
    const currentCandidate = candidateFor(current);
    if (fingerprint(current) !== input.expectedEvidenceToken) throw new Error("PROVENANCE_EVIDENCE_STALE");
    if (input.decision === "AUTOMATIC" && !currentCandidate.automaticApprovalEligible) {
      throw new Error("AUTOMATIC_PROVENANCE_EVIDENCE_INSUFFICIENT");
    }

    const updatedCount = await transaction.$executeRaw`
      UPDATE "Property"
      SET "availabilityStatusSource" = ${input.decision}::"AvailabilityStatusSource"
      WHERE "id" = ${current.id}
        AND "organizationId" = ${input.organizationId}
        AND "availabilityStatusSource" = 'UNKNOWN'::"AvailabilityStatusSource"
        AND "status" = ${current.status}
        AND "availabilityCount" = ${current.availabilityCount}
        AND "listingType" IS NOT DISTINCT FROM ${current.listingType}
        AND "externalId" IS NOT DISTINCT FROM ${current.externalId}
        AND "sourceName" IS NOT DISTINCT FROM ${current.sourceName}
        AND "sourceStatus" IS NOT DISTINCT FROM ${current.sourceStatus}
        AND "publicationStatus" = ${current.publicationStatus}
        AND "rent" = ${current.rent}
        AND "salePrice" IS NOT DISTINCT FROM ${current.salePrice}
        AND "updatedAt" = ${current.updatedAt}
    `;
    // Raw SQL avoids Prisma's @updatedAt behavior so provenance remains the only property field changed.
    if (updatedCount !== 1) throw new Error("PROVENANCE_EVIDENCE_STALE");

    await transaction.auditLog.create({
      data: {
        userId: input.actorUserId,
        entity: "PropertyAvailabilityProvenance",
        action: "classified",
        meta: {
          organizationId: input.organizationId,
          propertyId: current.id,
          priorSource: "UNKNOWN",
          approvedSource: input.decision,
          reason,
          confirmedIntentionalAvailability: input.decision === "STAFF" && input.confirmIntentionalAvailability === true,
          evidenceToken: input.expectedEvidenceToken,
          evidenceCategory: currentCandidate.evidenceCategory,
          priorAvailabilityStatus: current.status,
          priorListingType: current.listingType,
          priorExternalId: current.externalId,
          priorSourceName: current.sourceName
        } satisfies Prisma.InputJsonObject
      }
    });
    return {
      propertyId: current.id,
      availabilityStatusSource: input.decision,
      availabilityStatus: current.status,
      publicationStatus: current.publicationStatus
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
