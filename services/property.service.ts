import { prisma } from "@/lib/prisma/client";

export async function getProperties() {
  return prisma.property.findMany({ include: { images: true } });
}

export async function getPropertyById(id: string) {
  return prisma.property.findUnique({ where: { id }, include: { images: true } });
}
