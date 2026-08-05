import { PrismaClient } from "@prisma/client";

import { buildPrismaConnectionUrl } from "./connection";

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionUrl = buildPrismaConnectionUrl(
  process.env.DATABASE_URL ?? "",
  process.env.PRISMA_CONNECTION_LIMIT ?? "10"
);

export const prisma = globalThis.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: connectionUrl
    }
  }
});

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
