// Prisma queries for collections and their member contents.
import type { PrismaClient } from "@podkaap/db";
import { buildCursorPage, cursorWhere } from "../../common/utils/pagination";

// Creates repository methods for collection persistence and lookup.
export function createCollectionsRepository(prisma: PrismaClient) {
  return {
    // Reads a cursor-paginated collection list.
    async findMany(cursor?: string, limit = 20) {
      const items = await prisma.collection.findMany({
        where: cursorWhere(cursor),
        orderBy: { createdAt: "desc" },
        take: limit + 1,
      });
      return buildCursorPage(items, limit);
    },

    // Reads a single collection by primary id.
    async findById(id: string) {
      return prisma.collection.findUnique({ where: { id } });
    },

    // Reads ordered contents for a specific collection.
    async findContents(collectionId: string, cursor?: string, limit = 20) {
      const items = await prisma.content.findMany({
        where: { collectionId, ...cursorWhere(cursor) },
        orderBy: [{ role: "asc" }, { order: "asc" }, { createdAt: "asc" }],
        take: limit + 1,
      });
      return buildCursorPage(items, limit);
    },
  };
}

export type CollectionsRepository = ReturnType<typeof createCollectionsRepository>;
