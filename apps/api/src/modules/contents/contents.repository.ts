// Prisma queries for content records and outgoing warp links.
import type { PrismaClient } from "@podkaap/db";

// Creates repository methods for content lookup and warp traversal.
export function createContentsRepository(prisma: PrismaClient) {
  return {
    // Reads a single content row by primary id.
    async findById(id: string) {
      return prisma.content.findUnique({ where: { id } });
    },

    // Reads the next FULL content in the same collection order.
    async findNextFull(collectionId: string, currentOrder: number) {
      return prisma.content.findFirst({
        where: { collectionId, role: "FULL", order: { gt: currentOrder } },
        orderBy: { order: "asc" },
      });
    },

    // Reads all outgoing warp rows for a short content item.
    async findWarps(id: string) {
      return prisma.contentWarp.findMany({
        where: { shortContentId: id },
        orderBy: { createdAt: "asc" },
      });
    },
  };
}

export type ContentsRepository = ReturnType<typeof createContentsRepository>;
