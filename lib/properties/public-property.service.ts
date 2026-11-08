import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
export type { PropertyListingCategory } from "@/lib/properties/listing-category";

export const rentalListingTypeWhere: Prisma.PropertyWhereInput = {
  OR: [
    { listingType: null },
    { listingType: { notIn: ["For Sale", "FOR_SALE", "for sale", "FOR SALE", "sale", "SALE"], mode: "insensitive" } }
  ]
};

const publicRentalListingTypeWhere: Prisma.PropertyWhereInput = {
  listingType: {
    in: ["For Rent", "for_rent", "for-rent", "rent", "rental", "lease"],
    mode: "insensitive"
  }
};

export const publicRentalListingWhere: Prisma.PropertyWhereInput = {
  organizationId: { not: null },
  publicationStatus: "PUBLISHED",
  status: "AVAILABLE",
  rent: { gt: 0 },
  ...publicRentalListingTypeWhere,
  units: { some: { available: true, beds: { gte: 0 }, price: { gt: 0 } } }
};

const rentalWhere = publicRentalListingWhere;

const saleWhere: Prisma.PropertyWhereInput = {
  organizationId: { not: null },
  publicationStatus: "PUBLISHED",
  status: "AVAILABLE",
  salePrice: { gt: 0 },
  listingType: {
    in: ["For Sale", "for_sale", "for-sale", "sale", "buy", "purchase"],
    mode: "insensitive"
  }
};

const publicPropertyInclude = Prisma.validator<Prisma.PropertyInclude>()({
  images: true,
  units: {
    where: { available: true, beds: { gte: 0 }, price: { gt: 0 } },
    orderBy: [{ beds: "asc" }, { price: "asc" }]
  }
});

export interface PublicPropertyFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export interface ListPublicPropertiesOptions {
  listingType?: "RENT" | "SALE";
  limit?: number;
  offset?: number;
  filters?: PublicPropertyFilters;
}

function publicWhere(listingType: "RENT" | "SALE", filters?: PublicPropertyFilters): Prisma.PropertyWhereInput {
  const where = listingType === "SALE" ? saleWhere : rentalWhere;
  const and: Prisma.PropertyWhereInput[] = [];
  const location = filters?.location?.trim();
  if (location) {
    and.push({
      OR: [
        { address: { contains: location, mode: "insensitive" } },
        { city: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } }
      ]
    });
  }

  if (listingType === "SALE") {
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      and.push({
        salePrice: {
          ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {})
        }
      });
    }
  } else {
    if (filters?.minPrice !== undefined) {
      and.push({ OR: [{ rent: { gte: filters.minPrice } }, { rentMax: { gte: filters.minPrice } }] });
    }
    if (filters?.maxPrice !== undefined) and.push({ rent: { lte: filters.maxPrice } });
    if (filters?.bedrooms !== undefined) and.push({ bedrooms: { gte: filters.bedrooms } });
    if (filters?.bathrooms !== undefined) and.push({ bathrooms: { gte: filters.bathrooms } });
  }

  return and.length ? { ...where, AND: and } : where;
}

export function listPublicProperties(options?: ListPublicPropertiesOptions) {
  const listingType = options?.listingType ?? "RENT";
  return prisma.property.findMany({
    where: publicWhere(listingType, options?.filters),
    include: publicPropertyInclude,
    orderBy: { updatedAt: "desc" },
    take: options?.limit ?? 6,
    skip: options?.offset ?? 0
  });
}

export function countPublicProperties(
  listingType: "RENT" | "SALE" = "RENT",
  filters?: PublicPropertyFilters
) {
  return prisma.property.count({ where: publicWhere(listingType, filters) });
}

export function getPublicPropertyById(propertyId: string, listingType?: "RENT" | "SALE") {
  return prisma.property.findFirst({
    where: {
      id: propertyId,
      ...(listingType
        ? publicWhere(listingType)
        : { OR: [rentalWhere, saleWhere] })
    },
    include: publicPropertyInclude
  });
}
