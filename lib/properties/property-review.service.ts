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

const unavailableSourceStatuses = [
  "sold",
  "off market",
  "offmarket",
  "rented",
  "pending",
  "closed",
  "inactive",
  "not available",
  "unavailable",
  "coming soon"
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sourceListingFor(property: ReviewProperty): Record<string, unknown> | null {
  const metadata = property.sourceMetadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const listing = (metadata as Record<string, unknown>).sourceListing;
  return listing && typeof listing === "object" && !Array.isArray(listing)
    ? listing as Record<string, unknown>
    : null;
}

function normalizeSourceStatus(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")
    : "";
}

function hasConfirmedUnavailableSourceStatus(listing: Record<string, unknown>): boolean {
  const statuses = [listing.status, listing.status_text].map(normalizeSourceStatus).filter(Boolean);
  return statuses.some((status) => unavailableSourceStatuses.some((unavailable) => status.includes(unavailable)));
}

function saleAvailability(listing: Record<string, unknown> | null): PropertyAvailability {
  if (!listing) return "UNCERTAIN";
  if (hasConfirmedUnavailableSourceStatus(listing)) return "UNAVAILABLE";

  // Zillow's "FOR_SALE" category is not an availability signal. Only the
  // observed, explicit status_text value "Active" confirms sale availability.
  return normalizeSourceStatus(listing.status_text) === "active" ? "AVAILABLE" : "UNCERTAIN";
}

function rentalAvailability(
  property: ReviewProperty,
  listing: Record<string, unknown> | null
): PropertyAvailability {
  if (listing && hasConfirmedUnavailableSourceStatus(listing)) return "UNAVAILABLE";
  if (property.units.some((unit) => unit.available)) return "AVAILABLE";
  if (property.units.length > 0) return "UNAVAILABLE";
  return "UNCERTAIN";
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
  const listingType = property.listingType?.trim().toLowerCase().replace(/[_-]+/g, " ");
  const isRental = ["for rent", "rent", "rental", "lease"].includes(listingType ?? "");
  const isSale = ["for sale", "sale", "buy", "purchase"].includes(listingType ?? "");
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

  if (![property.address, property.city, property.state].every(isNonEmptyString)) reasons.push("address_incomplete");
  if (!isNonEmptyString(property.title) || /^zillow listing\b/i.test(property.title.trim())) reasons.push("title_missing_or_placeholder");
  if (!isNonEmptyString(property.description) || /^imported zillow property listing\.?$/i.test(property.description.trim())) {
    reasons.push("description_missing_or_placeholder");
  }
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
  if (property.images.length === 0 || property.images.every((image) => !isNonEmptyString(image.url))) reasons.push("property_image_missing");
  if (
    isRental
    && property.units.some((unit) => !Number.isInteger(unit.beds) || unit.beds < 0 || !Number.isSafeInteger(unit.price) || unit.price <= 0)
  ) reasons.push("rental_unit_data_invalid");

  if (
    property.sourceName !== "Zillow"
    || !property.externalId?.startsWith("zillow:")
    || !listing
    || !hasSourceId
  ) {
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
