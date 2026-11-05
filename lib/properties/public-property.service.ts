import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import type { PropertyListingCategory } from "./listing-category";

export const saleListingTypes = [
  "For Sale", "for sale", "for_sale", "for-sale", "sale",
  "buy", "purchase"
];

export const rentalListingTypeWhere: Prisma.PropertyWhereInput = {
  OR: [{ listingType: null }, { listingType: { notIn: ["For Sale", "FOR_SALE", "for sale", "FOR SALE", "sale", "SALE"] } }]
};

const publicRentalListingTypeWhere: Prisma.PropertyWhereInput = {
  OR: [{ listingType: null }, { listingType: { notIn: saleListingTypes, mode: "insensitive" } }]
};

const saleListingTypeWhere: Prisma.PropertyWhereInput = {
  listingType: { in: saleListingTypes, mode: "insensitive" }
};

export const publicRentalListingWhere: Prisma.PropertyWhereInput = {
  organizationId: { not: null },
  publicationStatus: "PUBLISHED",
  status: "AVAILABLE",
  rent: { gt: 0 },
  ...publicRentalListingTypeWhere,
  units: { some: { available: true } }
};

export const publicSaleListingWhere: Prisma.PropertyWhereInput = {
  organizationId: { not: null },
  publicationStatus: "PUBLISHED",
  status: "AVAILABLE",
  salePrice: { gt: 0 },
  ...saleListingTypeWhere
};

export type { PropertyListingCategory } from "./listing-category";

export interface PublicPropertyFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
}

const publicPropertyInclude = Prisma.validator<Prisma.PropertyInclude>()({
  images: true
});

export interface ListPublicPropertiesOptions {
  limit?: number;
  offset?: number;
  listingType?: PropertyListingCategory;
  filters?: PublicPropertyFilters;
}

function publicPropertyWhere(
  listingType: PropertyListingCategory,
  filters?: PublicPropertyFilters
): Prisma.PropertyWhereInput {
  const baseWhere = listingType === "SALE" ? publicSaleListingWhere : publicRentalListingWhere;
  const additionalConditions: Prisma.PropertyWhereInput[] = [];

  if (filters?.location) {
    const location = filters.location.trim().slice(0, 100);
    if (location) {
      additionalConditions.push({
        OR: [
          { address: { contains: location, mode: "insensitive" } },
          { city: { contains: location, mode: "insensitive" } },
          { state: { contains: location, mode: "insensitive" } }
        ]
      });
    }
  }

  const minimum = filters?.minPrice;
  const maximum = filters?.maxPrice;
  if (listingType === "SALE" && (minimum !== undefined || maximum !== undefined)) {
    additionalConditions.push({
      salePrice: {
        ...(minimum !== undefined ? { gte: minimum } : {}),
        ...(maximum !== undefined ? { lte: maximum } : {})
      }
    });
  } else if (listingType === "RENT" && (minimum !== undefined || maximum !== undefined)) {
    if (minimum !== undefined) {
      additionalConditions.push({
        OR: [
          { rent: { gte: minimum } },
          { rentMax: { gte: minimum } }
        ]
      });
    }
    if (maximum !== undefined) additionalConditions.push({ rent: { lte: maximum } });
  }

  if (filters?.bedrooms !== undefined) additionalConditions.push({ bedrooms: { gte: filters.bedrooms } });
  if (filters?.bathrooms !== undefined) additionalConditions.push({ bathrooms: { gte: filters.bathrooms } });

  return additionalConditions.length > 0
    ? { ...baseWhere, AND: additionalConditions }
    : baseWhere;
}

export function listPublicProperties(options?: ListPublicPropertiesOptions) {
  const limit = options?.limit ?? 6;
  const offset = options?.offset ?? 0;
  const listingType = options?.listingType ?? "RENT";

  return prisma.property.findMany({
    where: publicPropertyWhere(listingType, options?.filters),
    include: publicPropertyInclude,
    orderBy: { updatedAt: "desc" },
    take: limit,
    skip: offset
  });
}

export function countPublicProperties(listingType: PropertyListingCategory = "RENT", filters?: PublicPropertyFilters) {
  return prisma.property.count({
    where: publicPropertyWhere(listingType, filters)
  });
}

const publicPropertyDetailInclude = Prisma.validator<Prisma.PropertyInclude>()({
  images: true,
  units: {
    where: { available: true },
    orderBy: [{ beds: "asc" }, { price: "asc" }]
  }
});

export async function getPublicPropertyById(propertyId: string, listingType?: PropertyListingCategory) {
  if (listingType) {
    return prisma.property.findFirst({
      where: { id: propertyId, ...publicPropertyWhere(listingType) },
      include: publicPropertyDetailInclude
    });
  }

  const saleProperty = await prisma.property.findFirst({
    where: { id: propertyId, ...publicPropertyWhere("SALE") },
    include: publicPropertyDetailInclude
  });
  if (saleProperty) return saleProperty;

  return prisma.property.findFirst({
    where: { id: propertyId, ...publicPropertyWhere("RENT") },
    include: publicPropertyDetailInclude
  });
}
