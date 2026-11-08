import {
  normalizeZillowRentalAvailability,
  normalizeZillowSaleAvailability
} from "@/lib/properties/zillow-listing-status";
import { getPropertyListingCategory } from "@/lib/properties/listing-category";

export const PROPERTY_PUBLICATION_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED_UNPUBLISHED",
  "PUBLISHED",
  "REJECTED"
] as const;

export type PropertyPublicationStatus = (typeof PROPERTY_PUBLICATION_STATUSES)[number];
export type PropertyAvailability = "AVAILABLE" | "UNAVAILABLE" | "UNCERTAIN";

export function isPropertyPublicationStatus(value: unknown): value is PropertyPublicationStatus {
  return typeof value === "string" && PROPERTY_PUBLICATION_STATUSES.some((status) => status === value);
}

type ReviewProperty = {
  externalId: string | null;
  listingType: string | null;
  salePrice: number | null;
  rent: number;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  sourceName: string | null;
  sourceMetadata: unknown;
  status: string;
  units: Array<{ available: boolean; beds: number; price: number }>;
  images: Array<{ url: string }>;
};

export type PropertyReviewEvaluation = {
  decision: PropertyPublicationStatus;
  automaticDecision: Exclude<PropertyPublicationStatus, "REJECTED">;
  availability: PropertyAvailability;
  reasons: string[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasUsableImage(images: Array<{ url: string }>): boolean {
  return images.some(({ url }) => {
    if (!isNonEmptyString(url)) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  });
}

function isMeaningfulDescription(value: string): boolean {
  return isNonEmptyString(value)
    && !/^imported zillow property listing\.?$/i.test(value.trim())
    && value.trim().length >= 20;
}

function sourceListingForMetadata(metadata: unknown): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const listing = (metadata as Record<string, unknown>).sourceListing;
  return listing && typeof listing === "object" && !Array.isArray(listing)
    ? listing as Record<string, unknown>
    : null;
}

function hasTrustedZillowIdentity(
  property: Pick<ReviewProperty, "externalId" | "sourceName">,
  listing: Record<string, unknown> | null
): boolean {
  const propertyId = listing?.property_id;
  const validSourceId = (typeof propertyId === "string" && propertyId.trim().length > 0)
    || (typeof propertyId === "number" && Number.isFinite(propertyId));
  return property.sourceName === "Zillow"
    && Boolean(property.externalId)
    && validSourceId
    && property.externalId === `zillow:${String(propertyId)}`;
}

export function getSaleAvailabilityValidationReasons(property: Pick<ReviewProperty,
  "externalId" | "sourceName" | "sourceMetadata" | "salePrice" | "title" | "address" | "city" | "state" | "description" | "images"
>): string[] {
  const listing = sourceListingForMetadata(property.sourceMetadata);
  const reasons: string[] = [];
  if (!Number.isSafeInteger(property.salePrice) || (property.salePrice ?? 0) <= 0) reasons.push("sale_price_missing_or_invalid");
  if (!isNonEmptyString(property.title) || /^zillow listing\b/i.test(property.title.trim())) reasons.push("title_missing_or_placeholder");
  if (![property.address, property.city, property.state].every(isNonEmptyString)) reasons.push("address_incomplete");
  if (!isMeaningfulDescription(property.description)) reasons.push("description_missing_or_placeholder");
  if (!hasUsableImage(property.images)) reasons.push("property_image_missing");
  if (!hasTrustedZillowIdentity(property, listing)) reasons.push("trusted_source_identity_missing");
  return reasons;
}

function sourceListingFor(property: ReviewProperty): Record<string, unknown> | null {
  return sourceListingForMetadata(property.sourceMetadata);
}

function saleAvailability(listing: Record<string, unknown> | null): PropertyAvailability {
  return listing ? normalizeZillowSaleAvailability(listing) : "UNCERTAIN";
}

function rentalAvailability(
  property: ReviewProperty,
  listing: Record<string, unknown> | null
): PropertyAvailability {
  if (!listing) return "UNCERTAIN";
  const sourceAvailability = normalizeZillowRentalAvailability(listing);
  if (sourceAvailability !== "AVAILABLE") return sourceAvailability;

  const hasValidRent = Number.isSafeInteger(property.rent) && property.rent > 0;
  const hasAvailableUnit = property.units.some((unit) =>
    unit.available
    && Number.isInteger(unit.beds)
    && unit.beds >= 0
    && Number.isSafeInteger(unit.price)
    && unit.price > 0
  );
  return hasValidRent && hasAvailableUnit ? "AVAILABLE" : "UNCERTAIN";
}

export function evaluatePropertyForApproval(
  property: ReviewProperty,
  options: {
    duplicateInImport?: boolean;
    staffManagedStatus?: PropertyPublicationStatus | null;
    staffManaged?: boolean;
    availabilityOverride?: PropertyAvailability;
  } = {}
): PropertyReviewEvaluation {
  const listing = sourceListingFor(property);
  const hasSourceId = isNonEmptyString(listing?.property_id)
    || (typeof listing?.property_id === "number" && Number.isFinite(listing.property_id));
  const listingCategory = getPropertyListingCategory(property.listingType);
  const isRental = listingCategory === "RENT";
  const isSale = listingCategory === "SALE";
  const availability = options.availabilityOverride
    ?? (isRental ? rentalAvailability(property, listing) : isSale ? saleAvailability(listing) : "UNCERTAIN");
  const reasons: string[] = [];
  const metadata = property.sourceMetadata && typeof property.sourceMetadata === "object" && !Array.isArray(property.sourceMetadata)
    ? property.sourceMetadata as Record<string, unknown>
    : null;
  const previousImportReasons = metadata && typeof metadata.importReview === "object" && metadata.importReview !== null
    ? (metadata.importReview as Record<string, unknown>).reasons
    : null;
  if (Array.isArray(previousImportReasons)) {
    for (const reason of previousImportReasons) {
      if (isNonEmptyString(reason) && !reasons.includes(reason)) reasons.push(reason);
    }
  }

  if (!isRental && !isSale) reasons.push("listing_type_missing_or_unsupported");
  if (isRental && (!Number.isSafeInteger(property.rent) || property.rent <= 0)) reasons.push("rental_price_missing_or_invalid");
  if (isSale && (property.salePrice === null || !Number.isSafeInteger(property.salePrice) || property.salePrice <= 0)) {
    reasons.push("sale_price_missing_or_invalid");
  }
  if (isSale) {
    for (const reason of getSaleAvailabilityValidationReasons(property)) {
      if (!reasons.includes(reason)) reasons.push(reason);
    }
  }
  if (![property.address, property.city, property.state].every(isNonEmptyString) && !reasons.includes("address_incomplete")) {
    reasons.push("address_incomplete");
  }
  if ((!isNonEmptyString(property.title) || /^zillow listing\b/i.test(property.title.trim())) && !reasons.includes("title_missing_or_placeholder")) {
    reasons.push("title_missing_or_placeholder");
  }
  if (!isMeaningfulDescription(property.description) && !reasons.includes("description_missing_or_placeholder")) {
    reasons.push("description_missing_or_placeholder");
  }
  if (isRental) {
    if (
      !Number.isInteger(property.bedrooms)
      || property.bedrooms < 0
      || !listing
      || typeof listing.bedrooms !== "number"
      || !Number.isInteger(listing.bedrooms)
      || listing.bedrooms < 0
    ) reasons.push("bedrooms_missing_or_invalid");
    if (
      !Number.isFinite(property.bathrooms)
      || property.bathrooms <= 0
      || !listing
      || typeof listing.bathrooms !== "number"
      || !Number.isSafeInteger(listing.bathrooms)
      || listing.bathrooms <= 0
    ) reasons.push("bathrooms_missing_or_invalid");
    if (
      !Number.isFinite(property.sqft)
      || property.sqft <= 0
      || !listing
      || typeof listing.living_area !== "number"
      || listing.living_area <= 0
    ) reasons.push("living_area_missing_or_invalid");
  }
  if (!hasUsableImage(property.images) && !reasons.includes("property_image_missing")) reasons.push("property_image_missing");
  if (
    isRental
    && property.units.some((unit) => !Number.isInteger(unit.beds) || unit.beds < 0 || !Number.isSafeInteger(unit.price) || unit.price <= 0)
  ) reasons.push("rental_unit_data_invalid");
  if (isRental && !property.units.some((unit) =>
    unit.available
    && Number.isInteger(unit.beds)
    && unit.beds >= 0
    && Number.isSafeInteger(unit.price)
    && unit.price > 0
  )) reasons.push("rental_requires_unit_data");

  if (!hasTrustedZillowIdentity(property, listing) || !hasSourceId) {
    reasons.push("trusted_source_identity_missing");
  }

  if (options.duplicateInImport) reasons.push("duplicate_external_id_in_import");
  if (availability === "UNAVAILABLE") reasons.push("listing_confirmed_unavailable");
  if (availability === "UNCERTAIN") reasons.push("availability_not_confirmed");
  if (availability === "AVAILABLE" && property.status !== "AVAILABLE") reasons.push("availability_status_conflicts_with_source");

  const automaticDecision: Exclude<PropertyPublicationStatus, "REJECTED"> =
    reasons.length === 0 && availability === "AVAILABLE"
      ? "PUBLISHED"
      : "PENDING_REVIEW";

  if (options.staffManaged && options.staffManagedStatus) {
    return {
      decision: options.staffManagedStatus,
      automaticDecision,
      availability,
      reasons: ["staff_managed_publication_decision_preserved", ...reasons]
    };
  }

  return { decision: automaticDecision, automaticDecision, availability, reasons };
}
