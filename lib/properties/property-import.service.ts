import { z } from "zod";
import { prisma } from "@/lib/prisma/client";

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
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  zip: z.string().nullable().optional(),
  rent: z.number().finite().nonnegative(),
  rentMax: nullableNumber,
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
  title?: string;
  status: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
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

function normalizeProperty(input: SourceProperty) {
  const warnings: string[] = [];
  const unitBathrooms = input.units.map((unit) => unit.bathrooms).filter((value): value is number => typeof value === "number");
  const bathrooms = input.bathrooms ?? (unitBathrooms.length > 0 ? Math.max(...unitBathrooms) : 1);
  const sqft = input.sqft ?? 0;

  if (input.bathrooms === null || input.bathrooms === undefined) warnings.push("bathrooms was missing; stored as a derived unit value or 1");
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

  return {
    warnings,
    data: {
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
      bedrooms: input.bedrooms,
      bathrooms,
      sqft,
      amenities: input.amenities,
      specialOffers: input.specialOffers,
      availabilityCount: input.availabilityCount,
      status: input.status
    },
    units: input.units.map((unit) => ({ beds: unit.bedrooms, price: unit.rent, available: unit.isAvailable })),
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

async function findExistingProperty(externalId: string) {
  return prisma.property.findUnique({ where: { externalId }, select: { id: true, organizationId: true } });
}

async function persistProperty(organizationId: string, property: ReturnType<typeof normalizeProperty>, existingId?: string) {
  return prisma.$transaction(async (transaction) => {
    const saved = existingId
      ? await transaction.property.update({ where: { id: existingId }, data: { ...property.data, organizationId } })
      : await transaction.property.create({ data: { ...property.data, organizationId } });

    const existingUnits = await transaction.propertyUnit.findMany({ where: { propertyId: saved.id } });
    const usedUnitIds = new Set<string>();
    for (const unit of property.units) {
      const match = existingUnits.find((candidate) => !usedUnitIds.has(candidate.id) && candidate.beds === unit.beds && candidate.price === unit.price);
      if (match) {
        usedUnitIds.add(match.id);
        if (match.available !== unit.available) await transaction.propertyUnit.update({ where: { id: match.id }, data: { available: unit.available } });
      } else {
        await transaction.propertyUnit.create({ data: { propertyId: saved.id, ...unit } });
      }
    }

    for (const image of property.images) {
      const existingImage = await transaction.propertyImage.findFirst({ where: { propertyId: saved.id, url: image.url } });
      if (!existingImage) await transaction.propertyImage.create({ data: { propertyId: saved.id, ...image } });
      else if (!existingImage.altText && image.altText) await transaction.propertyImage.update({ where: { id: existingImage.id }, data: { altText: image.altText } });
    }

    return saved;
  }, { timeout: 30000 });
}

export async function importProperties(body: unknown, options: PropertyImportOptions): Promise<PropertyImportResponse> {
  const { properties: rawProperties, dryRun } = getPayload(body);
  const importId = crypto.randomUUID();
  const topWarnings = new Set<string>();
  const topErrors: string[] = [];
  const results: PropertyImportResult[] = [];
  const summary: PropertyImportSummary = { received: Array.isArray(rawProperties) ? rawProperties.length : 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  if (!Array.isArray(rawProperties)) {
    return { importId, status: dryRun ? "DRY_RUN" : "IMPORTED", summary, warnings: [], errors: ["properties must be an array"], results: [] };
  }

  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();
  for (const raw of rawProperties) {
    if (raw && typeof raw === "object" && typeof (raw as { externalId?: unknown }).externalId === "string") {
      const externalId = (raw as { externalId: string }).externalId;
      if (seenIds.has(externalId)) duplicateIds.add(externalId);
      seenIds.add(externalId);
    }
  }

  for (const [index, raw] of rawProperties.entries()) {
    const parsed = sourcePropertySchema.safeParse(raw);
    const externalId = parsed.success ? parsed.data.externalId : typeof raw === "object" && raw && "externalId" in raw && typeof raw.externalId === "string" ? raw.externalId : `row-${index + 1}`;
    if (!parsed.success) {
      summary.failed++;
      results.push({ externalId, status: "FAILED", warnings: [], errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "property"}: ${issue.message}`) });
      continue;
    }
    if (duplicateIds.has(parsed.data.externalId)) {
      summary.failed++;
      results.push({ externalId, title: parsed.data.title, status: "FAILED", warnings: [], errors: ["Duplicate externalId in this import"] });
      continue;
    }

    const normalized = normalizeProperty(parsed.data);
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
    try {
      const existing = await findExistingProperty(parsed.data.externalId);
      if (existing && existing.organizationId !== options.organizationId) throw new Error("Property belongs to another organization");
      const status = existing ? "UPDATED" : "CREATED";
      if (!dryRun) await persistProperty(options.organizationId, normalized, existing?.id);
      summary[status === "CREATED" ? "created" : "updated"]++;
      results.push({ externalId, title: parsed.data.title, status, warnings: [...warnings], errors: [] });
      for (const warning of warnings) topWarnings.add(`${externalId}: ${warning}`);
    } catch (error) {
      summary.failed++;
      console.error("[PropertyImport] persistence failure", {
        externalId,
        error
      });
      results.push({ externalId, title: parsed.data.title, status: "FAILED", warnings: [...warnings], errors: [error instanceof Error && error.message === "Property belongs to another organization" ? error.message : "Unable to persist property"] });
    }
  }

  return { importId, status: dryRun ? "DRY_RUN" : "IMPORTED", summary, warnings: [...topWarnings], errors: topErrors, results };
}