// Prisma queries for the canonical content-based user progress model.
import type { PrismaClient } from "@podkaap/db";

// Creates repository methods for user progress persistence and lookup.
export function createProgressRepository(prisma: PrismaClient) {
  return {
    // Reads one progress row for a user/content pair.
    async findByUserAndContent(userId: string, contentId: string) {
      return prisma.userProgress.findFirst({
        where: { userId, contentId },
      });
    },

    // Reads all progress rows for a user ordered by recency.
    async findAllByUser(userId: string) {
      return prisma.userProgress.findMany({
        where: { userId },
        orderBy: { lastWatchedAt: "desc" },
      });
    },

    // Upserts progress by first finding an existing row, then update/create.
    async upsert(userId: string, contentId: string, progressSeconds: number, isComplete: boolean) {
      const existing = await prisma.userProgress.findFirst({
        where: { userId, contentId },
      });

      if (existing) {
        return prisma.userProgress.update({
          where: { id: existing.id },
          data: {
            progressSeconds,
            isComplete: isComplete || existing.isComplete,
            lastWatchedAt: new Date(),
          },
        });
      }

      return prisma.userProgress.create({
        data: {
          userId,
          contentId,
          progressSeconds,
          isComplete,
          lastWatchedAt: new Date(),
        },
      });
    },

    // Marks progress complete, creating a row if one does not exist yet.
    async markComplete(userId: string, contentId: string) {
      const existing = await prisma.userProgress.findFirst({
        where: { userId, contentId },
      });

      if (existing) {
        return prisma.userProgress.update({
          where: { id: existing.id },
          data: { isComplete: true, lastWatchedAt: new Date() },
        });
      }

      return prisma.userProgress.create({
        data: {
          userId,
          contentId,
          progressSeconds: 0,
          isComplete: true,
          lastWatchedAt: new Date(),
        },
      });
    },
  };
}

export type ProgressRepository = ReturnType<typeof createProgressRepository>;
