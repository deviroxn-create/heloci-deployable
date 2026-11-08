import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import {
  evaluatePropertyForApproval,
  getSaleAvailabilityValidationReasons,
  isPropertyPublicationStatus,
  type PropertyReviewEvaluation
} from "@/lib/properties/property-review.service";
import {
  normalizeZillowRentalAvailability,
  normalizeZillowSaleAvailability
} from "@/lib/properties/zillow-listing-status";
import { getPropertyListingCategory } from "@/lib/properties/listing-category";

const nullableNumber = z.number().finite().nonnegative().nullable().optional();

const sourceUnitSchema = z.object({
  externalId: z.string().trim().min(1).optional(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: nullableNumber,
  rent: z.number().finite().nonnegative(),
  sqft: nullableNumber,
  isAvailable: z.boolean()
}).passthrough();

const sourceImageSchema = z.union([
  z.string().url(),
  z.object({
    url: z.string().url(),
    altText: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
    isPrimary: z.boolean().optional()
  }).passthrough()
]);

const sourcePropertySchema = z.object({
  externalId: z.string().trim().min(1),
  title: z.string().trim(),
  description: z.string().trim(),
  address: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  zip: z.string().nullable().optional(),
  rent: z.number().finite().nonnegative(),
  rentMax: nullableNumber,
  listingType: z.string().trim().min(1).nullable().optional(),
  salePrice: nullableNumber,
  sourceName: z.string().trim().min(1).optional(),
  sourceUrl: z.string().url().nullable().optional(),
  sourceStatus: z.string().nullable().optional(),
  sourceMetadata: z.unknown().optional(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: nullableNumber,
  sqft: nullableNumber,
  amenities: z.array(z.string()).default([]),
  specialOffers: z.array(z.string()).default([]),
  availabilityCount: z.number().int().nonnegative(),
  status: z.string().trim().min(1),
  lat: z.number().finite().nullable().optional(),
  lng: z.number().finite().nullable().optional(),
  units: z.array(sourceUnitSchema).default([]),
  images: z.array(sourceImageSchema).default([])
}).passthrough();

export type SourceProperty = z.infer<typeof sourcePropertySchema>;

type ZillowListing = Record<string, unknown> & {
  property_id?: unknown;
  property_name?: unknown;
  listing_type?: unknown;
};

type ZillowSourcePresence = {
  title: boolean;
  description: boolean;
  address: boolean;
  city: boolean;
  state: boolean;
  zip: boolean;
  bedrooms: boolean;
  bathrooms: boolean;
  sqft: boolean;
  sourceUrl: boolean;
  sourceStatus: boolean;
  latitude: boolean;
  longitude: boolean;
  images: boolean;
  units: boolean;
};

function asRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[$,]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function getListingType(value: unknown): "For Sale" | "For Rent" | null {
  const normalized = text(value)?.toLowerCase().replace(/[_-]+/g, " ");
  if (!normalized) return null;
  if (/\b(sale|buy|purchase)\b/.test(normalized)) return "For Sale";
  if (/\b(rent|rental|lease)\b/.test(normalized)) return "For Rent";
  return null;
}

function validHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function normalizeZillowListing(value: unknown) {
  if (!asRecord(value)) throw new Error("listing must be an object");
  const input = value as ZillowListing;
  const propertyId = text(input.property_id) ?? (typeof input.property_id === "number" && Number.isFinite(input.property_id) ? String(input.property_id) : undefined);
  const listingType = getListingType(input.listing_type);
  const price = numberValue(input.price);
  if (!propertyId) throw new Error("property_id is required");
  if (!listingType) throw new Error("listing_type must identify a sale or rental listing");

  const bedrooms = numberValue(input.bedrooms);
  const bathrooms = numberValue(input.bathrooms);
  const livingArea = numberValue(input.living_area);
  if (bedrooms !== undefined && (!Number.isInteger(bedrooms) || bedrooms < 0)) {
    throw new Error("bedrooms must be a non-negative integer when provided");
  }
  const isRental = getPropertyListingCategory(listingType) === "RENT";
  const statusParts = [text(input.status), text(input.status_text)].filter((part): part is string => Boolean(part));
  const propertyDetails = input.property_details;
  const details = asRecord(propertyDetails) ? propertyDetails : null;
  const statusText = [
    ...statusParts,
    text(input.marketing_status),
    text(details?.status),
    text(details?.status_text),
    text(details?.marketing_status)
  ].filter((part): part is string => Boolean(part)).join(" | ") || null;
  const sourceImageUrls = Array.isArray(input.image_urls) ? input.image_urls : [input.image_urls];
  const imageValues = [input.image_url, ...sourceImageUrls, input.tlocal_image];
  const images = [...new Set(imageValues.map(validHttpUrl).filter((url): url is string => Boolean(url)))];
  const warnings: string[] = [];
  if (imageValues.some((value) => value !== undefined && value !== null && !validHttpUrl(value))) {
    warnings.push("One or more source image values were not valid HTTP URLs and were not stored as images");
  }
  const isMultiUnit = /multi.?family|apartment building|apartment complex|duplex|triplex|fourplex/i.test(`${text(input.property_type) ?? ""} ${text(input.home_type) ?? ""}`);
  const sourceUnits = Array.isArray(input.units) ? input.units : [];
  const parsedUnits = isRental ? sourceUnits.map((unit) => sourceUnitSchema.safeParse(unit)) : [];
  const suppliedUnits = parsedUnits.flatMap((result) => result.success ? [result.data] : []);
  const invalidRentalUnits = isRental && suppliedUnits.length !== sourceUnits.length;
  const descriptionProvided = [input.description, input.details_summary, input.property_details]
    .some((candidate) => typeof candidate === "string" && Boolean(text(candidate)));
  const sourceStatusProvided = ["status", "status_text", "marketing_status"].some((key) => hasOwn(input, key))
    || Boolean(details && ["status", "status_text", "marketing_status"].some((key) => hasOwn(details, key)));
  const sourceImageFields = ["image_url", "image_urls", "tlocal_image"];
  const sourceImagesProvided = sourceImageFields.some((key) => hasOwn(input, key));
  const reviewReasons: string[] = [];
  const validPrice = price !== undefined && Number.isSafeInteger(price) && price > 0;
  const normalizedPrice = validPrice ? price : 0;
  const sourceAvailability = isRental
    ? normalizeZillowRentalAvailability(input)
    : normalizeZillowSaleAvailability(input);
  const availableUnitCount = suppliedUnits.filter((unit) =>
    unit.isAvailable
    && Number.isInteger(unit.bedrooms)
    && unit.bedrooms >= 0
    && Number.isSafeInteger(unit.rent)
    && unit.rent > 0
  ).length;

  if (!validPrice) {
    warnings.push(`${isRental ? "rental" : "sale"} price is missing or invalid in Zillow source data`);
    reviewReasons.push(isRental ? "rental_price_missing_or_invalid" : "sale_price_missing_or_invalid");
  }
  if (sourceAvailability === "UNAVAILABLE") reviewReasons.push("source_listing_inactive");
  if (sourceAvailability === "UNCERTAIN") reviewReasons.push("source_availability_uncertain");
  if (bedrooms === undefined) {
    warnings.push("bedrooms was missing; stored as 0 because the schema requires an integer");
    if (isRental) reviewReasons.push("bedrooms_missing");
  }
  if (invalidRentalUnits) {
    warnings.push("One or more rental units had invalid data and were omitted; review the source unit details");
    reviewReasons.push("rental_unit_data_invalid");
  }
  if (isRental && suppliedUnits.length === 0) {
    warnings.push("No unit-level data was supplied; no rental units were created and the listing remains unavailable pending review");
    reviewReasons.push(isMultiUnit ? "multi_unit_requires_unit_data" : "rental_requires_unit_data");
  }
  if (isRental && suppliedUnits.length > 0 && availableUnitCount === 0 && !reviewReasons.includes("rental_requires_unit_data")) {
    reviewReasons.push("rental_requires_unit_data");
  }
  const rent = isRental ? normalizedPrice : 0;
  const salePrice = isRental || !validPrice ? null : normalizedPrice;
  const title = text(input.property_name) ?? "";
  const description = text(input.description) ?? text(input.details_summary) ?? (typeof input.property_details === "string" ? text(input.property_details) : undefined) ?? "";
  const address = text(input.address) ?? "";
  const city = text(input.city) ?? "";
  const state = text(input.state) ?? "";
  const sourceMetadata = {
    sourceListing: input,
    importReview: { required: false, reasons: [] as string[] }
  };
  if (!isRental) {
    for (const reason of getSaleAvailabilityValidationReasons({
      externalId: `zillow:${propertyId}`,
      sourceName: "Zillow",
      sourceMetadata,
      salePrice,
      title,
      address,
      city,
      state,
      description,
      images: images.map((url) => ({ url }))
    })) {
      if (!reviewReasons.includes(reason)) reviewReasons.push(reason);
    }
    if (reviewReasons.some((reason) => [
      "title_missing_or_placeholder",
      "address_incomplete",
      "description_missing_or_placeholder",
      "property_image_missing"
    ].includes(reason))) {
      warnings.push("Sale listing is missing a valid title, address, meaningful description, or usable image and remains unavailable pending review");
    }
  }
  sourceMetadata.importReview = { required: reviewReasons.length > 0, reasons: reviewReasons };
  const saleRequirementsPass = isRental || getSaleAvailabilityValidationReasons({
    externalId: `zillow:${propertyId}`,
    sourceName: "Zillow",
    sourceMetadata,
    salePrice,
    title,
    address,
    city,
    state,
    description,
    images: images.map((url) => ({ url }))
  }).length === 0;
  const canBeAvailable = sourceAvailability === "AVAILABLE"
    && (isRental ? rent > 0 && availableUnitCount > 0 : saleRequirementsPass);

  return {
    externalId: `zillow:${propertyId}`,
    title,
    description,
    address,
    city,
    state,
    zip: text(input.zip) ?? null,
    rent,
    rentMax: null,
    listingType,
    salePrice,
    sourceName: "Zillow",
    sourceUrl: validHttpUrl(input.property_url) ?? null,
    sourceStatus: statusText,
    sourceMetadata,
    sourcePresence: {
      title: text(input.property_name) !== undefined,
      description: descriptionProvided,
      address: text(input.address) !== undefined,
      city: text(input.city) !== undefined,
      state: text(input.state) !== undefined,
      zip: input.zip === null || text(input.zip) !== undefined,
      bedrooms: bedrooms !== undefined,
      bathrooms: bathrooms !== undefined,
      sqft: livingArea !== undefined,
      sourceUrl: input.property_url === null || validHttpUrl(input.property_url) !== undefined,
      sourceStatus: sourceStatusProvided,
      latitude: input.latitude === null || numberValue(input.latitude) !== undefined,
      longitude: input.longitude === null || numberValue(input.longitude) !== undefined,
      images: sourceImagesProvided,
      units: hasOwn(input, "units") && (!isRental || !invalidRentalUnits)
    },
    bedrooms: bedrooms === undefined ? 0 : Math.trunc(bedrooms),
    bathrooms: bathrooms ?? null,
    sqft: livingArea === undefined ? null : Math.round(livingArea),
    amenities: [],
    specialOffers: [],
    availabilityCount: isRental && canBeAvailable ? availableUnitCount : 0,
    status: canBeAvailable ? "AVAILABLE" : "UNAVAILABLE",
    lat: numberValue(input.latitude) ?? null,
    lng: numberValue(input.longitude) ?? null,
    units: isRental ? suppliedUnits : [],
    images: images.map((url) => ({ url, altText: text(input.property_name) ?? null })),
    importWarnings: warnings
  };
}

function adaptIncomingProperty(input: unknown): { value: unknown; externalId?: string; error?: string; zillowListing?: ZillowListing } {
  if (!asRecord(input) || !("property_id" in input || "listing_type" in input || "property_name" in input)) {
    return { value: input };
  }
  const propertyId = text(input.property_id) ?? (typeof input.property_id === "number" ? String(input.property_id) : undefined);
  try {
    return { value: normalizeZillowListing(input), externalId: propertyId ? `zillow:${propertyId}` : undefined, zillowListing: input };
  } catch (error) {
    return {
      value: input,
      externalId: propertyId ? `zillow:${propertyId}` : undefined,
      error: error instanceof Error ? error.message : "Unable to normalize Zillow listing"
    };
  }
}

export interface PropertyImportRequest {
  properties: unknown;
  dryRun?: boolean;
}

export interface PropertyImportOptions {
  organizationId: string;
  dryRun?: boolean;
}

export interface PropertyImportResult {
  externalId: string;
  propertyId?: string;
  title?: string;
  status: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
  changes?: string[];
  review?: Pick<PropertyReviewEvaluation, "decision" | "availability" | "reasons">;
  warnings: string[];
  errors: string[];
}

export interface PropertyImportSummary {
  received: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface PropertyImportResponse {
  importId: string;
  status: "DRY_RUN" | "IMPORTED";
  summary: PropertyImportSummary;
  warnings: string[];
  errors: string[];
  results: PropertyImportResult[];
}

const unsupportedFields = [
  "units[].externalId",
  "units[].bathrooms",
  "units[].sqft",
  "images[].sortOrder",
  "images[].isPrimary"
];

function normalizeProperty(
  input: SourceProperty,
  staffDecision?: { publicationStatus?: string; publicationStatusSource?: string },
  availabilityOverride?: PropertyReviewEvaluation["availability"]
) {
  const sourcePresence = (input as SourceProperty & { sourcePresence?: ZillowSourcePresence }).sourcePresence;
  const warnings = Array.isArray((input as SourceProperty & { importWarnings?: unknown }).importWarnings)
    ? (input as SourceProperty & { importWarnings: string[] }).importWarnings
    : [];
  const unitBathrooms = input.units.map((unit) => unit.bathrooms).filter((value): value is number => typeof value === "number");
  const bathrooms = input.bathrooms ?? (unitBathrooms.length > 0 ? Math.max(...unitBathrooms) : 0);
  const sqft = input.sqft ?? 0;

  if (input.bathrooms === null || input.bathrooms === undefined) warnings.push("bathrooms was missing; stored as 0 because the schema requires an integer and must be reviewed before publication");
  if (input.sqft === null || input.sqft === undefined) warnings.push("sqft was missing; stored as the schema-required placeholder 0 and must be reviewed before publication");
  if (input.units.some((unit) => unit.externalId || unit.bathrooms !== null && unit.bathrooms !== undefined || unit.sqft !== null && unit.sqft !== undefined)) {
    warnings.push("unsupported unit fields were ignored during persistence");
  }
  if (input.images.some((image) => typeof image !== "string" && (image.sortOrder !== undefined || image.isPrimary !== undefined))) {
    warnings.push("unsupported image ordering/primary fields were ignored during persistence");
  }
  if (input.availabilityCount !== input.units.filter((unit) => unit.isAvailable).length) {
    warnings.push("availabilityCount is a source count and was not replaced with units.length");
  }

  const data = {
    externalId: input.externalId,
    title: input.title,
    description: input.description,
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip ?? null,
    latitude: input.lat ?? null,
    longitude: input.lng ?? null,
    rent: input.rent,
    rentMax: input.rentMax ?? null,
    listingType: input.listingType ?? null,
    salePrice: input.salePrice == null ? null : Math.round(input.salePrice),
    sourceName: input.sourceName ?? null,
    sourceUrl: input.sourceUrl ?? null,
    sourceStatus: input.sourceStatus ?? null,
    sourceMetadata: {
      ...metadataRecord(input.sourceMetadata),
      helociAvailabilityDecision: {
        version: 1,
        source: "AUTOMATIC",
        status: input.status
      }
    } as Prisma.InputJsonValue,
    bedrooms: input.bedrooms,
    bathrooms,
    sqft,
    amenities: input.amenities,
    specialOffers: input.specialOffers,
    availabilityCount: input.availabilityCount,
    status: input.status,
    availabilityStatusSource: "AUTOMATIC" as const
  };
  const isZillow = isZillowProperty(data);
  const review = isZillow
    ? evaluatePropertyForApproval({
      ...data,
      sourceMetadata: input.sourceMetadata,
      units: input.units.map((unit) => ({ available: unit.isAvailable, beds: unit.bedrooms, price: unit.rent })),
      images: input.images.map((image) => ({ url: typeof image === "string" ? image : image.url }))
    }, {
      staffManaged: staffDecision?.publicationStatusSource === "STAFF"
        || staffDecision?.publicationStatus === "REJECTED"
        || staffDecision?.publicationStatus === "APPROVED_UNPUBLISHED",
      staffManagedStatus: isPropertyPublicationStatus(staffDecision?.publicationStatus)
        ? staffDecision.publicationStatus
        : null,
      ...(availabilityOverride ? { availabilityOverride } : {})
    })
    : null;

  return {
    warnings,
    sourcePresence,
    data: {
      ...data,
      ...(review ? {
        publicationStatus: review.decision,
        publicationStatusSource: staffDecision?.publicationStatusSource === "STAFF" ? "STAFF" : "AUTOMATIC"
      } : {})
    },
    review,
    units: input.units.map((unit, index) => ({
      key: unit.externalId ? `external:${unit.externalId}` : `row:${index}:${unit.bedrooms}:${unit.rent}`,
      beds: unit.bedrooms,
      price: unit.rent,
      available: unit.isAvailable
    })),
    images: [...new Map(input.images.map((image) => {
      const normalized = typeof image === "string" ? { url: image, altText: null } : { url: image.url, altText: image.altText ?? null };
      return [normalized.url, normalized] as const;
    })).values()]
  };
}

function getPayload(body: unknown): { properties: unknown; dryRun: boolean } {
  if (Array.isArray(body)) return { properties: body, dryRun: false };
  if (body && typeof body === "object" && "properties" in body) {
    const request = body as { properties: unknown; dryRun?: unknown };
    return { properties: request.properties, dryRun: request.dryRun === true };
  }
  return { properties: body, dryRun: false };
}

type ZillowUnit = { key: string; beds: number; price: number; available: boolean };
type ZillowImage = { url: string; altText: string | null };
type ImportTransaction = Prisma.TransactionClient;

function metadataRecord(value: unknown): Record<string, unknown> {
  return asRecord(value) ? value : {};
}

function sourceListingFromMetadata(value: unknown): ZillowListing | null {
  const listing = metadataRecord(value).sourceListing;
  return asRecord(listing) ? listing : null;
}

function sourceAvailability(listing: ZillowListing, listingType: string | null): "AVAILABLE" | "UNAVAILABLE" | "UNCERTAIN" {
  const category = getPropertyListingCategory(listingType);
  return category === "SALE"
    ? normalizeZillowSaleAvailability(listing)
    : category === "RENT"
      ? normalizeZillowRentalAvailability(listing)
      : "UNCERTAIN";
}

function previousInactiveStatus(listing: ZillowListing, listingType: string | null): string | undefined {
  const detailsValue = listing.property_details;
  const details = asRecord(detailsValue) ? detailsValue : null;
  const values = [
    listing.status,
    listing.status_text,
    listing.marketing_status,
    details?.status,
    details?.status_text,
    details?.marketing_status
  ];
  return values.find((value): value is string =>
    typeof value === "string"
    && sourceAvailability({ status: value }, listingType) === "UNAVAILABLE"
  );
}

function mergeZillowListing(existingMetadata: unknown, incoming: ZillowListing): ZillowListing {
  const previous = sourceListingFromMetadata(existingMetadata) ?? {};
  const merged = { ...previous, ...incoming };
  for (const field of ["property_name", "description", "address", "city", "state"]) {
    if (hasOwn(incoming, field) && !text(incoming[field]) && text(previous[field])) merged[field] = previous[field];
  }
  const listingType = getListingType(incoming.listing_type) ?? getListingType(previous.listing_type);
  const previousAvailability = sourceAvailability(previous, listingType);
  const incomingAvailability = sourceAvailability(incoming, listingType);
  if (previousAvailability === "UNAVAILABLE" && incomingAvailability !== "UNAVAILABLE") {
    const inactiveStatus = previousInactiveStatus(previous, listingType);
    if (inactiveStatus) merged.status_text = inactiveStatus;
  }
  if (getListingType(incoming.listing_type) === "For Sale") merged.units = [];
  return merged;
}

function getZillowImageUrls(listing: ZillowListing | null): string[] {
  if (!listing) return [];
  const values = [listing.image_url, ...(Array.isArray(listing.image_urls) ? listing.image_urls : [listing.image_urls]), listing.tlocal_image];
  return [...new Set(values.map(validHttpUrl).filter((url): url is string => Boolean(url)))];
}

function getManagedImageUrls(metadata: Record<string, unknown>, listing: ZillowListing | null): string[] {
  const urls = metadata.importedImageUrls;
  return Array.isArray(urls) ? urls.filter((url): url is string => typeof url === "string") : getZillowImageUrls(listing);
}

function getManagedUnitState(
  metadata: Record<string, unknown>,
  listing: ZillowListing | null,
  existingUnits: Array<{ id: string; beds: number; price: number }>
): { ids: Record<string, string>; ownershipUnverified: boolean } {
  const units = metadata.importedUnitIds;
  if (asRecord(units)) {
    return {
      ids: Object.fromEntries(Object.entries(units).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
      ownershipUnverified: metadata.legacyUnitOwnershipUnverified === true
    };
  }

  const ownershipUnverified = Boolean(listing && Array.isArray(listing.units) && listing.units.length > 0 && existingUnits.length > 0);
  return { ids: {}, ownershipUnverified };
}

function isZillowProperty(property: { externalId?: string | null; sourceName?: string | null }): boolean {
  return property.externalId?.startsWith("zillow:") === true && property.sourceName === "Zillow";
}

async function findExistingProperty(externalId: string, organizationId: string) {
  return prisma.property.findFirst({
    where: { externalId, organizationId },
    include: { images: true, units: true }
  });
}

async function findPropertyByExternalId(externalId: string) {
  return prisma.property.findUnique({ where: { externalId }, select: { id: true, organizationId: true, sourceName: true, sourceMetadata: true } });
}

async function syncZillowImages(transaction: ImportTransaction, propertyId: string, images: ZillowImage[], managedUrls: string[]) {
  const existingImages = await transaction.propertyImage.findMany({ where: { propertyId } });
  const managed = new Set(managedUrls);
  const desired = new Set(images.map((image) => image.url));
  const stillManaged = new Set<string>();
  let changed = false;

  for (const image of existingImages) {
    if (managed.has(image.url) && !desired.has(image.url)) {
      await transaction.propertyImage.delete({ where: { id: image.id } });
      changed = true;
    } else if (managed.has(image.url) && desired.has(image.url)) {
      stillManaged.add(image.url);
    }
  }

  for (const image of images) {
    const existing = existingImages.find((candidate) => candidate.url === image.url && !managed.has(candidate.url));
    const existingManaged = existingImages.find((candidate) => candidate.url === image.url && managed.has(candidate.url));
    if (existing || existingManaged) continue;
    await transaction.propertyImage.create({ data: { propertyId, ...image } });
    stillManaged.add(image.url);
    changed = true;
  }

  return { urls: [...stillManaged], changed };
}

async function syncZillowUnits(transaction: ImportTransaction, propertyId: string, units: ZillowUnit[], managedUnitIds: Record<string, string>, enabled: boolean) {
  if (!enabled) return { ids: managedUnitIds, changed: false };

  const existingUnits = await transaction.propertyUnit.findMany({ where: { propertyId } });
  const managedIds = new Set(Object.values(managedUnitIds));
  const currentKeys = new Set(units.map((unit) => unit.key));
  const nextIds = { ...managedUnitIds };
  let changed = false;

  for (const [key, id] of Object.entries(managedUnitIds)) {
    if (currentKeys.has(key)) continue;
    const existing = existingUnits.find((unit) => unit.id === id);
    if (existing?.available) {
      await transaction.propertyUnit.update({ where: { id }, data: { available: false } });
      changed = true;
    }
  }

  for (const unit of units) {
    const managedId = managedUnitIds[unit.key];
    const existing = existingUnits.find((candidate) => candidate.id === managedId);
    if (existing) {
      if (existing.beds !== unit.beds || existing.price !== unit.price || existing.available !== unit.available) {
        await transaction.propertyUnit.update({ where: { id: existing.id }, data: { beds: unit.beds, price: unit.price, available: unit.available } });
        changed = true;
      }
      continue;
    }

    const duplicateManualUnit = existingUnits.some((candidate) => !managedIds.has(candidate.id) && candidate.beds === unit.beds && candidate.price === unit.price);
    if (duplicateManualUnit) continue;

    const created = await transaction.propertyUnit.create({ data: { propertyId, beds: unit.beds, price: unit.price, available: unit.available } });
    if (created.id) nextIds[unit.key] = created.id;
    changed = true;
  }

  return { ids: nextIds, changed };
}

async function persistProperty(organizationId: string, property: ReturnType<typeof normalizeProperty>) {
  return prisma.$transaction(async (transaction) => {
    const saved = await transaction.property.create({ data: { ...property.data, organizationId } });
    const isZillow = isZillowProperty({ externalId: property.data.externalId, sourceName: property.data.sourceName });
    const managedUnitIds: Record<string, string> = {};
    const managedImageUrls: string[] = [];

    const existingUnits = await transaction.propertyUnit.findMany({ where: { propertyId: saved.id } });
    const usedUnitIds = new Set<string>();
    const seenUnitKeys = new Set<string>();
    for (const unit of property.units) {
      if (seenUnitKeys.has(unit.key)) continue;
      seenUnitKeys.add(unit.key);
      const match = existingUnits.find((candidate) => !usedUnitIds.has(candidate.id) && candidate.beds === unit.beds && candidate.price === unit.price);
      if (match) {
        usedUnitIds.add(match.id);
        if (match.available !== unit.available) await transaction.propertyUnit.update({ where: { id: match.id }, data: { available: unit.available } });
        if (isZillow) managedUnitIds[unit.key] = match.id;
      } else {
        const created = await transaction.propertyUnit.create({ data: { propertyId: saved.id, beds: unit.beds, price: unit.price, available: unit.available } });
        if (isZillow && created.id) managedUnitIds[unit.key] = created.id;
      }
    }

    for (const image of property.images) {
      const existingImage = await transaction.propertyImage.findFirst({ where: { propertyId: saved.id, url: image.url } });
      if (!existingImage) {
        await transaction.propertyImage.create({ data: { propertyId: saved.id, ...image } });
        if (isZillow) managedImageUrls.push(image.url);
      } else if (!existingImage.altText && image.altText) {
        await transaction.propertyImage.update({ where: { id: existingImage.id }, data: { altText: image.altText } });
      }
    }

    if (isZillow) {
      const sourceMetadata = {
        ...metadataRecord(property.data.sourceMetadata),
        importedImageUrls: managedImageUrls,
        importedUnitIds: managedUnitIds
      };
      await transaction.property.update({ where: { id: saved.id }, data: { sourceMetadata: sourceMetadata as Prisma.InputJsonValue } });
    }

    return saved;
  }, { timeout: 30000 });
}

function jsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

const sourceFieldLabels: Partial<Record<keyof ZillowSourcePresence, [string, string]>> = {
  title: ["title", "title"],
  description: ["description", "description"],
  address: ["address", "address"],
  city: ["city", "city"],
  state: ["state", "state"],
  zip: ["zip", "ZIP"],
  bedrooms: ["bedrooms", "bedrooms"],
  bathrooms: ["bathrooms", "bathrooms"],
  sqft: ["sqft", "living area"],
  sourceUrl: ["sourceUrl", "source URL"],
  sourceStatus: ["sourceStatus", "source status"],
  latitude: ["latitude", "latitude"],
  longitude: ["longitude", "longitude"]
};

type ExistingZillowProperty = NonNullable<Awaited<ReturnType<typeof findExistingProperty>>>;

function prepareZillowUpdate(
  existing: ExistingZillowProperty,
  property: ReturnType<typeof normalizeProperty>
) {
  const presence = property.sourcePresence;
  const previousMetadata = metadataRecord(existing.sourceMetadata);
  const previousListing = sourceListingFromMetadata(previousMetadata);
  let previousNormalized: ReturnType<typeof normalizeZillowListing> | null = null;
  if (previousListing) {
    try {
      previousNormalized = normalizeZillowListing(previousListing);
    } catch {
      previousNormalized = null;
    }
  }
  const managedImageUrls = getManagedImageUrls(previousMetadata, previousListing);
  const managedUnitState = getManagedUnitState(previousMetadata, previousListing, existing.units);
  const managedUnitIds = managedUnitState.ids;
  const patch: Record<string, unknown> = { sourceName: "Zillow" };
  const canUpdateField = (field: keyof typeof property.data) => {
    const currentValue = existing[field as keyof typeof existing];
    if (previousNormalized) {
      return jsonEqual(currentValue, previousNormalized[field as keyof typeof previousNormalized]);
    }
    if (typeof currentValue === "string") return currentValue.trim().length === 0;
    if (typeof currentValue === "number") return currentValue === 0;
    return currentValue === null || currentValue === undefined;
  };

  for (const field of ["listingType", "rent", "salePrice"] as const) {
    if (canUpdateField(field)) patch[field] = property.data[field];
  }

  if (presence) {
    for (const [sourceField, [dataField]] of Object.entries(sourceFieldLabels) as Array<[keyof ZillowSourcePresence, [string, string]]>) {
      if (presence[sourceField] && canUpdateField(dataField as keyof typeof property.data)) {
        patch[dataField] = property.data[dataField as keyof typeof property.data];
      }
    }
  }

  const sourceListing = sourceListingFromMetadata(property.data.sourceMetadata);
  const rentalSourceInactive = property.data.listingType === "For Rent"
    && normalizeZillowRentalAvailability(sourceListing) === "UNAVAILABLE";
  const shouldSyncUnits = property.data.listingType === "For Sale"
    || rentalSourceInactive
    || Boolean(presence?.units);
  const managedUnitIdsSet = new Set(Object.values(managedUnitIds));
  const manualUnits = existing.units.filter((unit) => !managedUnitIdsSet.has(unit.id));
  const incomingUnits = property.units.map((unit) => ({
    id: unit.key,
    beds: unit.beds,
    price: unit.price,
    available: unit.available
  }));
  const incomingUnitKeys = new Set(property.units.map((unit) => unit.key));
  const staleManagedUnits = existing.units
    .filter((unit) => managedUnitIdsSet.has(unit.id))
    .filter((unit) => !Object.entries(managedUnitIds).some(([key, id]) => id === unit.id && incomingUnitKeys.has(key)))
    .map((unit) => ({ ...unit, available: false }));
  const effectiveUnits = shouldSyncUnits
    ? [
      ...manualUnits,
      ...staleManagedUnits,
      ...incomingUnits.filter((unit) => !manualUnits.some((manual) =>
        manual.beds === unit.beds && manual.price === unit.price
      ))
    ]
    : existing.units;
  const managedImageUrlSet = new Set(managedImageUrls);
  const effectiveImages = [
    ...existing.images.filter((image) => !managedImageUrlSet.has(image.url)),
    ...property.images
  ];
  const finalData = {
    ...property.data,
    ...patch,
    availabilityStatusSource: existing.availabilityStatusSource
  };
  if (!("listingType" in patch)) finalData.listingType = existing.listingType;
  if (!("salePrice" in patch)) finalData.salePrice = existing.salePrice;
  if (!("rent" in patch)) finalData.rent = existing.rent;
  if (!("title" in patch)) finalData.title = existing.title;
  if (!("description" in patch)) finalData.description = existing.description;
  if (!("address" in patch)) finalData.address = existing.address;
  if (!("city" in patch)) finalData.city = existing.city;
  if (!("state" in patch)) finalData.state = existing.state;
  if (!("bedrooms" in patch)) finalData.bedrooms = existing.bedrooms;
  if (!("bathrooms" in patch)) finalData.bathrooms = existing.bathrooms;
  if (!("sqft" in patch)) finalData.sqft = existing.sqft;
  const saleAvailabilityReasons = finalData.listingType === "For Sale"
    ? getSaleAvailabilityValidationReasons({
      externalId: finalData.externalId,
      sourceName: finalData.sourceName,
      sourceMetadata: property.data.sourceMetadata,
      salePrice: finalData.salePrice,
      title: finalData.title,
      address: finalData.address,
      city: finalData.city,
      state: finalData.state,
      description: finalData.description,
      images: effectiveImages.map((image) => ({ url: image.url }))
    })
    : [];
  const validRentalUnits = effectiveUnits.filter((unit) =>
    unit.available
    && Number.isInteger(unit.beds)
    && unit.beds >= 0
    && Number.isSafeInteger(unit.price)
    && unit.price > 0
  );
  const canBeAvailable = finalData.listingType === "For Sale"
    ? normalizeZillowSaleAvailability(sourceListing) === "AVAILABLE" && saleAvailabilityReasons.length === 0
    : finalData.listingType === "For Rent"
      && normalizeZillowRentalAvailability(sourceListing) === "AVAILABLE"
      && Number.isSafeInteger(finalData.rent)
      && finalData.rent > 0
      && validRentalUnits.length > 0
      && !managedUnitState.ownershipUnverified;
  if (existing.availabilityStatusSource === "AUTOMATIC") {
    if (managedUnitState.ownershipUnverified && finalData.listingType === "For Rent") {
      patch.status = "UNAVAILABLE";
      patch.availabilityCount = 0;
      patch.availabilityStatusSource = "AUTOMATIC";
    } else if (finalData.listingType === "For Sale" || rentalSourceInactive || presence?.units) {
      patch.status = canBeAvailable ? "AVAILABLE" : "UNAVAILABLE";
      patch.availabilityCount = finalData.listingType === "For Rent" && canBeAvailable ? validRentalUnits.length : 0;
      patch.availabilityStatusSource = "AUTOMATIC";
    }
  }
  const nextMetadata = {
    ...previousMetadata,
    ...metadataRecord(property.data.sourceMetadata)
  };
  if (existing.availabilityStatusSource === "AUTOMATIC") {
    nextMetadata.helociAvailabilityDecision = {
      version: 1,
      source: "AUTOMATIC",
      status: typeof patch.status === "string" ? patch.status : existing.status
    };
  } else if (Object.hasOwn(previousMetadata, "helociAvailabilityDecision")) {
    nextMetadata.helociAvailabilityDecision = previousMetadata.helociAvailabilityDecision;
  } else {
    delete nextMetadata.helociAvailabilityDecision;
  }
  const availabilityOverride = managedUnitState.ownershipUnverified && finalData.listingType === "For Rent"
    ? "UNCERTAIN"
    : finalData.listingType === "For Sale"
      ? normalizeZillowSaleAvailability(sourceListing)
      : finalData.listingType === "For Rent"
        ? normalizeZillowRentalAvailability(sourceListing)
        : "UNCERTAIN";
  const review = evaluatePropertyForApproval({
    externalId: finalData.externalId,
    listingType: finalData.listingType,
    salePrice: finalData.salePrice,
    rent: finalData.rent,
    title: finalData.title,
    description: finalData.description,
    address: finalData.address,
    city: finalData.city,
    state: finalData.state,
    bedrooms: finalData.bedrooms,
    bathrooms: finalData.bathrooms,
    sqft: finalData.sqft,
    sourceName: finalData.sourceName,
    sourceMetadata: nextMetadata,
    status: typeof patch.status === "string" ? patch.status : existing.status,
    units: effectiveUnits,
    images: effectiveImages.map((image) => ({ url: image.url }))
  }, {
    staffManaged: existing.publicationStatusSource === "STAFF"
      || existing.publicationStatus === "REJECTED"
      || existing.publicationStatus === "APPROVED_UNPUBLISHED",
    staffManagedStatus: isPropertyPublicationStatus(existing.publicationStatus)
      ? existing.publicationStatus
      : null,
    availabilityOverride
  });
  const staffManaged = existing.publicationStatusSource === "STAFF"
    || existing.publicationStatus === "REJECTED"
    || existing.publicationStatus === "APPROVED_UNPUBLISHED";
  if (!staffManaged) {
    patch.publicationStatus = review.decision;
    patch.publicationStatusSource = "AUTOMATIC";
  }

  return {
    patch,
    previousMetadata,
    nextMetadata,
    managedImageUrls,
    managedUnitState,
    managedUnitIds,
    shouldSyncUnits,
    review
  };
}

async function updateZillowProperty(
  existing: ExistingZillowProperty,
  organizationId: string,
  property: ReturnType<typeof normalizeProperty>,
  prepared: ReturnType<typeof prepareZillowUpdate>
) {
  const {
    patch,
    previousMetadata,
    nextMetadata,
    managedImageUrls,
    managedUnitState,
    managedUnitIds,
    shouldSyncUnits,
    review
  } = prepared;
  const changedFields = Object.keys(patch).filter((field) => !jsonEqual(
    (existing as unknown as Record<string, unknown>)[field],
    patch[field]
  ));
  const updateData: Record<string, unknown> = Object.fromEntries(changedFields.map((field) => [field, patch[field]]));
  let sourceDetailsChanged = false;

  const mediaResult = await prisma.$transaction(async (transaction) => {
    const scopedWhere = {
      id: existing.id,
      externalId: existing.externalId,
      organizationId,
      sourceName: "Zillow"
    };
    await transaction.$queryRaw`SELECT "id" FROM "Property" WHERE "id" = ${existing.id} AND "externalId" = ${existing.externalId} AND "organizationId" = ${organizationId} AND "sourceName" = 'Zillow' FOR UPDATE`;
    const guarded = await transaction.property.findFirst({
      where: scopedWhere,
      select: { id: true, availabilityStatusSource: true }
    });
    if (!guarded) throw new Error("Property organization or source changed during import");
    if (patch.availabilityStatusSource === "AUTOMATIC" && guarded.availabilityStatusSource !== "AUTOMATIC") {
      throw new Error("Property availability decision changed during import");
    }

    const images = await syncZillowImages(transaction, existing.id, property.images, managedImageUrls);
    const units = await syncZillowUnits(transaction, existing.id, property.units, managedUnitIds, shouldSyncUnits);
    const sourceMetadata = {
      ...nextMetadata,
      importedImageUrls: images.urls,
      importedUnitIds: units.ids,
      ...(managedUnitState.ownershipUnverified ? { legacyUnitOwnershipUnverified: true } : {})
    };
    sourceDetailsChanged = !jsonEqual(previousMetadata, sourceMetadata);
    if (sourceDetailsChanged) updateData.sourceMetadata = sourceMetadata;

    if (Object.keys(updateData).length > 0) {
      const updated = await transaction.property.updateMany({ where: scopedWhere, data: updateData as Prisma.PropertyUpdateManyMutationInput });
      if (updated.count !== 1) throw new Error("Property organization or source changed during import");
    }

    return { imagesChanged: images.changed, unitsChanged: units.changed };
  }, { timeout: 30000 });

  const changes = changedFields.map((field) => {
    if (field === "listingType") return "listing type";
    if (field === "salePrice" || field === "rent") return "price";
    if (field === "sourceMetadata") return "source details";
    return sourceFieldLabels[Object.keys(sourceFieldLabels).find((key) => sourceFieldLabels[key as keyof ZillowSourcePresence]?.[0] === field) as keyof ZillowSourcePresence]?.[1] ?? field;
  });
  if (sourceDetailsChanged) changes.push("source details");
  if (mediaResult.imagesChanged) changes.push("images");
  if (mediaResult.unitsChanged) changes.push("rental units");

  return {
    propertyId: existing.id,
    changes,
    review,
    warnings: managedUnitState.ownershipUnverified
      ? ["Legacy rental units could not be confidently attributed to Zillow; existing units were preserved and this listing remains unavailable pending review."]
      : []
  };
}

export async function importProperties(body: unknown, options: PropertyImportOptions): Promise<PropertyImportResponse> {
  const { properties: rawProperties, dryRun: requestDryRun } = getPayload(body);
  const dryRun = requestDryRun || options.dryRun === true;
  const importId = crypto.randomUUID();
  const topWarnings = new Set<string>();
  const topErrors: string[] = [];
  const results: PropertyImportResult[] = [];
  const summary: PropertyImportSummary = { received: Array.isArray(rawProperties) ? rawProperties.length : 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  if (!Array.isArray(rawProperties)) {
    return { importId, status: dryRun ? "DRY_RUN" : "IMPORTED", summary, warnings: [], errors: ["properties must be an array"], results: [] };
  }

  const adapted = rawProperties.map(adaptIncomingProperty);
  const duplicateIndexes = new Set<number>();
  const seenIds = new Set<string>();
  for (const [index, item] of adapted.entries()) {
    const raw = item.value;
    const externalId = item.externalId ?? (asRecord(raw) ? text(raw.externalId) : undefined);
    if (externalId) {
      if (seenIds.has(externalId)) duplicateIndexes.add(index);
      seenIds.add(externalId);
    }
  }

  for (const [index, item] of adapted.entries()) {
    const raw = item.value;
    const fallbackId = item.externalId ?? (asRecord(raw) ? text(raw.externalId) : undefined) ?? `row-${index + 1}`;
    if (item.error) {
      summary.failed++;
      results.push({ externalId: fallbackId, status: "FAILED", warnings: [], errors: [item.error] });
      continue;
    }
    let parsed = sourcePropertySchema.safeParse(raw);
    const externalId = item.externalId ?? (parsed.success ? parsed.data.externalId : fallbackId);
    let existing: Awaited<ReturnType<typeof findExistingProperty>> = null;
    try {
      if (item.zillowListing) {
        existing = await findExistingProperty(externalId, options.organizationId);
        if (!existing) {
          const conflict = await findPropertyByExternalId(externalId);
          if (conflict && conflict.organizationId !== options.organizationId) {
            summary.failed++;
            results.push({ externalId, status: "FAILED", warnings: [], errors: ["Property belongs to another organization"] });
            continue;
          }
          if (conflict) existing = await findExistingProperty(externalId, options.organizationId);
        }

        if (existing && isZillowProperty(existing)) {
          const mergedInput = normalizeZillowListing(mergeZillowListing(existing.sourceMetadata, item.zillowListing));
          parsed = sourcePropertySchema.safeParse(mergedInput);
        }
      } else if (parsed.success) {
        existing = await findExistingProperty(parsed.data.externalId, options.organizationId);
        if (!existing) {
          const conflict = await findPropertyByExternalId(parsed.data.externalId);
          if (conflict && conflict.organizationId !== options.organizationId) {
            summary.failed++;
            results.push({ externalId, status: "FAILED", warnings: [], errors: ["Property belongs to another organization"] });
            continue;
          }
          if (conflict) existing = await findExistingProperty(parsed.data.externalId, options.organizationId);
        }
      }

      if (!parsed.success) {
        summary.failed++;
        results.push({ externalId, status: "FAILED", warnings: [], errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "property"}: ${issue.message}`) });
        continue;
      }

      if (duplicateIndexes.has(index)) {
        summary.skipped++;
        results.push({ externalId, propertyId: existing?.id, title: parsed.data.title, status: "SKIPPED", warnings: [], errors: ["Duplicate externalId in this import"] });
        continue;
      }

      if (existing && (!item.zillowListing || !isZillowProperty(existing))) {
        summary.skipped++;
        results.push({ externalId, propertyId: existing.id, title: parsed.data.title, status: "SKIPPED", warnings: [], errors: ["External ID already exists; existing property was not changed"] });
        continue;
      }

      const previousMetadata = existing ? metadataRecord(existing.sourceMetadata) : {};
      const previousListing = existing ? sourceListingFromMetadata(previousMetadata) : null;
      const managedUnitState = existing
        ? getManagedUnitState(previousMetadata, previousListing, existing.units)
        : null;
      const normalized = normalizeProperty(
        parsed.data,
        existing ? {
          publicationStatus: existing.publicationStatus,
          publicationStatusSource: existing.publicationStatusSource
        } : undefined,
        managedUnitState?.ownershipUnverified && parsed.data.listingType === "For Rent" ? "UNCERTAIN" : undefined
      );
      const preparedUpdate = existing ? prepareZillowUpdate(existing, normalized) : null;
      const finalReview = preparedUpdate?.review ?? normalized.review;
      const warnings = new Set(normalized.warnings);
      for (const field of unsupportedFields) {
        const hasUnsupportedField = field === "units[].externalId"
          ? parsed.data.units.some((unit) => unit.externalId !== undefined)
          : field === "units[].bathrooms"
            ? parsed.data.units.some((unit) => unit.bathrooms !== undefined && unit.bathrooms !== null)
            : field === "units[].sqft"
              ? parsed.data.units.some((unit) => unit.sqft !== undefined && unit.sqft !== null)
              : parsed.data.images.some((image) => typeof image !== "string" && image[field === "images[].sortOrder" ? "sortOrder" : "isPrimary"] !== undefined);
        if (hasUnsupportedField) warnings.add(`${field} is not stored by the current schema`);
      }

      if (existing) {
        const existingMetadata = metadataRecord(existing.sourceMetadata);
        const previousListing = sourceListingFromMetadata(existingMetadata);
        const unitOwnership = getManagedUnitState(existingMetadata, previousListing, existing.units);
        if (unitOwnership.ownershipUnverified) {
          warnings.add("Legacy rental units could not be confidently attributed to Zillow; existing units were preserved and this listing remains unavailable pending review.");
        }
        if (dryRun) {
          summary.updated++;
          results.push({
            externalId,
            propertyId: existing.id,
            title: normalized.data.title,
            status: "UPDATED",
            changes: ["preview only"],
            ...(finalReview ? { review: finalReview } : {}),
            warnings: [...warnings],
            errors: []
          });
        } else {
          const update = await updateZillowProperty(
            existing,
            options.organizationId,
            normalized,
            preparedUpdate ?? prepareZillowUpdate(existing, normalized)
          );
          for (const warning of update.warnings) warnings.add(warning);
          const status = update.changes.length > 0 ? "UPDATED" : "SKIPPED";
          summary[status === "UPDATED" ? "updated" : "skipped"]++;
          results.push({
            externalId,
            propertyId: update.propertyId,
            title: normalized.data.title,
            status,
            changes: update.changes,
            ...(update.review ? { review: update.review } : {}),
            warnings: [...warnings],
            errors: []
          });
        }
      } else {
        const saved = dryRun ? null : await persistProperty(options.organizationId, normalized);
        summary.created++;
        results.push({
          externalId,
          propertyId: saved?.id,
          title: normalized.data.title,
          status: "CREATED",
          ...(normalized.review ? { review: normalized.review } : {}),
          warnings: [...warnings],
          errors: []
        });
      }
      for (const warning of warnings) topWarnings.add(`${externalId}: ${warning}`);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        const racedProperty = await findExistingProperty(externalId, options.organizationId).catch(() => null);
        const conflict = racedProperty ?? await findPropertyByExternalId(externalId).catch(() => null);
        if (conflict && conflict.organizationId !== options.organizationId) {
          summary.failed++;
          results.push({ externalId, title: parsed.success ? parsed.data.title : undefined, status: "FAILED", warnings: [], errors: ["Property belongs to another organization"] });
          continue;
        }
        if (racedProperty && item.zillowListing && isZillowProperty(racedProperty)) {
          const racedInput = normalizeZillowListing(mergeZillowListing(racedProperty.sourceMetadata, item.zillowListing));
          const racedParsed = sourcePropertySchema.safeParse(racedInput);
          if (!racedParsed.success) throw new Error("Unable to validate concurrent Zillow update");
          const racedNormalized = normalizeProperty(racedParsed.data);
          const racedPrepared = prepareZillowUpdate(racedProperty, racedNormalized);
          const update = await updateZillowProperty(racedProperty, options.organizationId, racedNormalized, racedPrepared);
          const status = update.changes.length > 0 ? "UPDATED" : "SKIPPED";
          summary[status === "UPDATED" ? "updated" : "skipped"]++;
          results.push({ externalId, propertyId: update.propertyId, title: racedNormalized.data.title, status, changes: update.changes, warnings: [...racedNormalized.warnings, ...update.warnings], errors: [] });
          continue;
        }
        if (conflict) {
          summary.skipped++;
          results.push({ externalId, propertyId: conflict.id, title: parsed.success ? parsed.data.title : undefined, status: "SKIPPED", warnings: [], errors: ["External ID already exists; existing property was not changed"] });
          continue;
        }
      }
      summary.failed++;
      console.error("[PropertyImport] persistence failure", {
        externalId,
        error
      });
      results.push({ externalId, title: parsed.success ? parsed.data.title : undefined, status: "FAILED", warnings: [], errors: [error instanceof Error && error.message === "Property belongs to another organization" ? error.message : "Unable to persist property"] });
    }
  }

  return { importId, status: dryRun ? "DRY_RUN" : "IMPORTED", summary, warnings: [...topWarnings], errors: topErrors, results };
}