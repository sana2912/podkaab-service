// Prisma queries for user reaction persistence and summaries.
import type { PrismaClient, TargetType, Emotion } from "@podkaap/db";

// Creates repository methods for reaction persistence and lookup.
export function createReactionsRepository(prisma: PrismaClient) {
  return {
    // Creates a new user reaction row.
    async create(userId: string, targetId: string, targetType: TargetType, emotion: Emotion) {
      return prisma.userReaction.create({
        data: { userId, targetId, targetType, emotion },
      });
    },

    // Reads reactions for one target entity ordered by newest first.
    async findByTarget(targetId: string, targetType: TargetType) {
      return prisma.userReaction.findMany({
        where: { targetId, targetType },
        orderBy: { createdAt: "desc" },
      });
    },

    // Builds a simple emotion-count summary for one full content item.
    async summarizeByContent(contentId: string) {
      const reactions = await prisma.userReaction.findMany({
        where: { targetId: contentId, targetType: "FULL_CONTENT" },
      });

      const summary: Record<string, number> = {};
      for (const r of reactions) {
        summary[r.emotion] = (summary[r.emotion] ?? 0) + 1;
      }
      return { contentId, total: reactions.length, breakdown: summary };
    },
  };
}

export type ReactionsRepository = ReturnType<typeof createReactionsRepository>;
