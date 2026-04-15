// Worker-local Prisma lifecycle helpers.
import { PrismaClient } from "@podkaap/db";

let _prisma: PrismaClient | null = null;

// Returns a worker-scoped Prisma singleton to avoid reconnect churn.
export function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient({ log: ["error"] });
  }
  return _prisma;
}

// Closes the worker-scoped Prisma client during shutdown.
export async function disconnectPrisma(): Promise<void> {
  await _prisma?.$disconnect();
  _prisma = null;
}
