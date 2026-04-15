// Prisma queries for assembling content-based in-progress viewing state.
import type { PrismaClient } from "@podkaap/db";

// Creates repository methods for continue-watching lookups.
export function createContinueWatchingRepository(prisma: PrismaClient) {
  return {
    // Reads in-progress content progress rows and hydrates them with content + collection data.
    async findInProgress(userId: string, limit = 10) {
      const progress = await prisma.userProgress.findMany({
        where: { userId, isComplete: false, progressSeconds: { gt: 0 } },
        orderBy: { lastWatchedAt: "desc" },
        take: limit,
      });

      if (progress.length === 0) return [];

      const contentIds = progress.map((p) => p.contentId);
      const contents = await prisma.content.findMany({
        where: { id: { in: contentIds }, role: "FULL" },
        include: {
          collection: { select: { id: true, title: true, coverUrl: true, fullMode: true } },
        },
      });

      const contentMap = new Map(contents.map((c) => [c.id, c]));

      return progress
        .map((p) => {
          const content = contentMap.get(p.contentId);
          if (!content) return null;
          return { progress: p, content };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    },
  };
}

export type ContinueWatchingRepository = ReturnType<typeof createContinueWatchingRepository>;
