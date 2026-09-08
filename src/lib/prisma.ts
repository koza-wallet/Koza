import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient. In dev, Next.js hot-reloads modules on every file
 * save — without caching the instance on `globalThis`, each reload of a file
 * that does `new PrismaClient()` opens a fresh connection pool against
 * Supabase's pooler that's never closed, and repeated edits exhaust it
 * (symptoms: multi-second queries, intermittent auth/session failures).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
