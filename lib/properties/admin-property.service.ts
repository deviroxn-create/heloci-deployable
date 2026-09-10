import { prisma } from "@/lib/prisma/client";
import { documentStorageService } from "@/lib/documents/storage.service";

const propertyFields = {
  id: true,
  externalId: true,
  title: true,
  description: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  latitude: true,
  longitude: true,
  rent: true,
  rentMax: true,
  bedrooms: true,
  bathrooms: true,
  sqft: true,
  amenities: true,
  specialOffers: true,
  contactPhone: true,
  availabilityCount: true,
  status: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  images: true,
  units: true
} as const;

export interface PropertyInput {
  externalId?: string | null;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rent: number;
  rentMax?: number | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  amenities?: string[];
  specialOffers?: string[];
  contactPhone?: string | null;
  availabilityCount?: number;
  status?: string;
}

export interface PropertyUnitInput {
  beds: number;
  price: number;
  available?: boolean;
}

export interface PropertyImageInput {
  url: string;
  altText?: string | null;
}

const requiredTextFields = ["title", "description", "address", "city", "state"] as const;

function validatePropertyInput(input: Partial<PropertyInput>) {
  for (const field of requiredTextFields) {
    if (typeof input[field] !== "string" || !input[field]?.trim()) {
      throw new Error(`${field} is required`);
    }
  }

  for (const field of ["rent", "bedrooms", "bathrooms", "sqft"] as const) {
    if (typeof input[field] !== "number" || input[field] < 0) {
      throw new Error(`${field} must be a non-negative number`);
    }
  }

  if (input.rentMax !== undefined && input.rentMax !== null && (typeof input.rentMax !== "number" || input.rentMax < 0)) {
    throw new Error("rentMax must be a non-negative number");
  }

  if (input.availabilityCount !== undefined && (!Number.isInteger(input.availabilityCount) || input.availabilityCount < 0)) {
    throw new Error("availabilityCount must be a non-negative integer");
  }

  for (const field of ["amenities", "specialOffers"] as const) {
    if (input[field] !== undefined && (!Array.isArray(input[field]) || input[field].some((value) => typeof value !== "string"))) {
      throw new Error(`${field} must be an array of strings`);
    }
  }
}

function toPropertyData(input: PropertyInput) {
  validatePropertyInput(input);
  return {
    externalId: input.externalId ?? null,
    title: input.title.trim(),
    description: input.description.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    rent: input.rent,
    rentMax: input.rentMax ?? null,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    sqft: input.sqft,
    amenities: input.amenities ?? [],
    specialOffers: input.specialOffers ?? [],
    contactPhone: input.contactPhone ?? null,
    availabilityCount: input.availabilityCount ?? 0,
    status: input.status ?? "UNAVAILABLE"
  };
}

export function listPropertiesForOrganization(organizationId: string, status?: string) {
  return prisma.property.findMany({
    where: { organizationId, ...(status ? { status } : {}) },
    select: propertyFields,
    orderBy: { updatedAt: "desc" }
  });
}

export function getPropertyForOrganization(organizationId: string, propertyId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, organizationId },
    select: propertyFields
  });
}

export async function createPropertyForOrganization(organizationId: string, input: PropertyInput) {
  return prisma.property.create({
    data: { ...toPropertyData(input), organizationId },
    select: propertyFields
  });
}

export async function updatePropertyForOrganization(organizationId: string, propertyId: string, input: Partial<PropertyInput>) {
  const existing = await getPropertyForOrganization(organizationId, propertyId);
  if (!existing) throw new Error("PROPERTY_NOT_FOUND");

  validatePropertyInput({ ...existing, ...input });
  return prisma.property.update({
    where: { id: propertyId },
    data: input,
    select: propertyFields
  });
}

export async function getPropertyEntryReadiness(organizationId: string, propertyId: string) {
  const property = await getPropertyForOrganization(organizationId, propertyId);
  if (!property) throw new Error("PROPERTY_NOT_FOUND");

  const availableUnitCount = property.units.filter((unit) => unit.available).length;
  const requiredDetailsComplete = Boolean(property.title && property.description && property.address && property.city && property.state);
  const unitsEntered = property.units.length > 0;
  const availableUnits = availableUnitCount > 0;
  const imagesEntered = property.images.length > 0;
  const statusConsistent = property.status === "AVAILABLE" ? availableUnits : true;
  return {
    propertyId: property.id,
    status: property.status,
    checks: {
      organizationAssigned: property.organizationId !== null,
      requiredDetailsComplete,
      unitsEntered,
      availableUnits,
      imagesEntered,
      statusConsistent
    },
    availableUnitCount,
    imageCount: property.images.length,
    readyForProgramAssignment: property.organizationId !== null && requiredDetailsComplete && unitsEntered && availableUnits && imagesEntered && statusConsistent && property.status === "AVAILABLE"
  };
}

export async function addPropertyUnit(organizationId: string, propertyId: string, input: PropertyUnitInput) {
  if (!Number.isInteger(input.beds) || input.beds < 0) throw new Error("beds must be a non-negative integer");
  if (typeof input.price !== "number" || input.price < 0) throw new Error("price must be a non-negative number");

  const property = await getPropertyForOrganization(organizationId, propertyId);
  if (!property) throw new Error("PROPERTY_NOT_FOUND");

  const unit = await prisma.propertyUnit.create({
    data: { propertyId, beds: input.beds, price: input.price, available: input.available ?? true }
  });
  await syncPropertyAvailability(propertyId);
  return unit;
}

export async function updatePropertyUnit(organizationId: string, propertyId: string, unitId: string, input: PropertyUnitInput) {
  if (!Number.isInteger(input.beds) || input.beds < 0) throw new Error("beds must be a non-negative integer");
  if (typeof input.price !== "number" || input.price < 0) throw new Error("price must be a non-negative number");

  const property = await getPropertyForOrganization(organizationId, propertyId);
  if (!property) throw new Error("PROPERTY_NOT_FOUND");

  const unit = await prisma.propertyUnit.updateMany({
    where: { id: unitId, propertyId },
    data: { beds: input.beds, price: input.price, available: input.available ?? true }
  });
  if (unit.count === 0) throw new Error("PROPERTY_UNIT_NOT_FOUND");
  await syncPropertyAvailability(propertyId);
  return prisma.propertyUnit.findUnique({ where: { id: unitId } });
}

export async function deletePropertyUnit(organizationId: string, propertyId: string, unitId: string) {
  const property = await getPropertyForOrganization(organizationId, propertyId);
  if (!property) throw new Error("PROPERTY_NOT_FOUND");

  const deleted = await prisma.propertyUnit.deleteMany({ where: { id: unitId, propertyId } });
  if (deleted.count === 0) throw new Error("PROPERTY_UNIT_NOT_FOUND");
  return syncPropertyAvailability(propertyId);
}

export async function addPropertyImage(organizationId: string, propertyId: string, input: PropertyImageInput) {
  if (typeof input.url !== "string" || !input.url.trim()) throw new Error("url is required");
  const property = await getPropertyForOrganization(organizationId, propertyId);
  if (!property) throw new Error("PROPERTY_NOT_FOUND");

  return prisma.propertyImage.create({
    data: { propertyId, url: input.url.trim(), altText: input.altText?.trim() || null }
  });
}

export async function uploadPropertyImage(organizationId: string, propertyId: string, file: File, altText?: string | null) {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image files must be 10MB or smaller");
  const property = await getPropertyForOrganization(organizationId, propertyId);
  if (!property) throw new Error("PROPERTY_NOT_FOUND");

  const uploaded = await documentStorageService.uploadPropertyImage(Buffer.from(await file.arrayBuffer()), file.name, { propertyId });
  return prisma.propertyImage.create({
    data: { propertyId, url: uploaded.secureUrl, altText: altText?.trim() || null }
  });
}

export async function deletePropertyImage(organizationId: string, propertyId: string, imageId: string) {
  const property = await getPropertyForOrganization(organizationId, propertyId);
  if (!property) throw new Error("PROPERTY_NOT_FOUND");

  const deleted = await prisma.propertyImage.deleteMany({ where: { id: imageId, propertyId } });
  if (deleted.count === 0) throw new Error("PROPERTY_IMAGE_NOT_FOUND");
}

export async function syncPropertyAvailability(propertyId: string) {
  const availableUnitCount = await prisma.propertyUnit.count({ where: { propertyId, available: true } });
  return prisma.property.update({
    where: { id: propertyId },
    data: { availabilityCount: availableUnitCount, status: availableUnitCount > 0 ? "AVAILABLE" : "UNAVAILABLE" }
  });
}