import { prisma } from "@/lib/prisma/client";

const APPROVED_STATUS = "approved";
const AVAILABLE_STATUS = "AVAILABLE";

export async function getApprovedApplicantProperties(userId: string) {
  const now = new Date();
  const applications = await prisma.programApplication.findMany({
    where: {
      userId,
      status: APPROVED_STATUS
    },
    select: {
      id: true,
      program: {
        select: {
          id: true,
          name: true,
          slug: true,
          organizationId: true,
          programProperties: {
            where: {
              isActive: true,
              OR: [{ availableFrom: null }, { availableFrom: { lte: now } }],
              AND: [{ OR: [{ availableUntil: null }, { availableUntil: { gte: now } }] }],
              property: {
                status: AVAILABLE_STATUS,
                units: { some: { available: true } }
              }
            },
            select: {
              id: true,
              isActive: true,
              availableFrom: true,
              availableUntil: true,
              property: {
                select: {
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
                  availabilityCount: true,
                  status: true,
                  images: {
                    select: { id: true, url: true, altText: true }
                  },
                  units: {
                    where: { available: true },
                    select: { id: true, beds: true, price: true, available: true }
                  }
                }
              }
            },
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });

  return applications.map((application) => ({
    applicationId: application.id,
    program: {
      id: application.program.id,
      name: application.program.name,
      slug: application.program.slug,
      organizationId: application.program.organizationId
    },
    properties: application.program.programProperties.map((programProperty) => ({
      programPropertyId: programProperty.id,
      availableFrom: programProperty.availableFrom,
      availableUntil: programProperty.availableUntil,
      property: programProperty.property
    }))
  }));
}