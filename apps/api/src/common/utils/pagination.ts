// Cursor pagination helpers reused by list-style modules.
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from "../../config/constants";

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Parse & clamp pagination parameters from request query.
 */
export function parsePagination(params: CursorPaginationParams): {
  cursor: string | undefined;
  limit: number;
} {
  const limit = Math.min(params.limit ?? PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT);
  return { cursor: params.cursor, limit };
}

/**
 * Build a cursor-paginated result.
 * Fetches limit+1 items, uses the extra item to determine `hasMore`,
 * and returns the id of the last real item as the next cursor.
 */
export function buildCursorPage<T extends { id: string }>(
  items: T[],
  limit: number
): CursorPaginationResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const lastItem = data[data.length - 1];
  const nextCursor = hasMore && lastItem ? lastItem.id : null;
  return { data, nextCursor, hasMore };
}

/**
 * Build a Prisma `where` clause fragment for cursor-based pagination.
 * Assumes string ids that are stable enough to act as cursors in the current app.
 */
export function cursorWhere(cursor?: string): { id?: { gt: string } } {
  if (!cursor) return {};
  return { id: { gt: cursor } };
}
