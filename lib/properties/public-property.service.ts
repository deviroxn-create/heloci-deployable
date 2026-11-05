import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export const rentalListingTypeWhere: Prisma.PropertyWhereInput = {
  OR: [{ listingType: null }, { listingType: { notIn: ["For Sale", "FOR_SALE", "for sale", "FOR SALE", "sale", "SALE"] } }]
};

const publicPropertyWhere = {
  organizationId: { not: null },
  status: "AVAILABLE",
  ...rentalListingTypeWhere,
  units: { some: { available: true } }
} as const;

const publicPropertyInclude = Prisma.validator<Prisma.PropertyInclude>()({
  images: true
});

export interface ListPublicPropertiesOptions {
  limit?: number;
  offset?: number;
}

export function listPublicProperties(options?: ListPublicPropertiesOptions) {
  const limit = options?.limit ?? 6;
  const offset = options?.offset ?? 0;

  return prisma.property.findMany({
    where: publicPropertyWhere,
    include: publicPropertyInclude,
    orderBy: { updatedAt: "desc" },
    take: limit,
    skip: offset
  });
}

export function countPublicProperties() {
  return prisma.property.count({
    where: publicPropertyWhere
  });
}

export function getPublicPropertyById(propertyId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, ...publicPropertyWhere },
    include: publicPropertyInclude
  });
}
