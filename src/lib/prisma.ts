// Mock mode: use in-memory data instead of real PostgreSQL
// Switch back to real Prisma when connecting to a database:
//   import { PrismaClient } from "@prisma/client";
//   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
//   export const prisma = globalForPrisma.prisma ?? new PrismaClient();
//   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import { mockPrisma } from "./mock-prisma";

export const prisma = mockPrisma as any;

export default prisma;
