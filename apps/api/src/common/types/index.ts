// Small shared API types used across request handlers and utilities.
import type { PrismaClient } from "@podkaap/db";

export interface RequestContext {
  prisma: PrismaClient;
  userId?: string;
}

export type WithId<T> = T & { id: string };

export interface ListQuery {
  cursor?: string;
  limit?: number;
}
