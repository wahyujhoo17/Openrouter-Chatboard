import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@prisma/adapter-postgresql";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    adapter: PrismaAdapter,
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
