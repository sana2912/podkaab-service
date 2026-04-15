// Feed-specific Prisma queries for candidate sourcing and analytics writes.
import type { PrismaClient } from "@podkaap/db";
import { FEED_CANDIDATE_POOL_SIZE } from "../../config/constants";

// Creates repository methods used by the personalized feed pipeline.
export function createFeedRepository(prisma: PrismaClient) {
  return {
    /** Pull a broad candidate pool of short + long content for the feed engine to rank. */
    async getCandidates(userId: string, limit = FEED_CANDIDATE_POOL_SIZE) {
      // Use content-based playback progress for collection-awareness and completed filtering.
      const completedProgress = await prisma.userProgress.findMany({
        where: { userId, isComplete: true },
        select: { contentId: true },
      });
      const completedContentIds = completedProgress.map((p) => p.contentId);

      const inProgressProgress = await prisma.userProgress.findMany({
        where: { userId, isComplete: false },
        select: { contentId: true },
      });

      const inProgressContentIds = inProgressProgress.map((p) => p.contentId);
      const inProgressContents = await prisma.content.findMany({
        where: { id: { in: inProgressContentIds } },
        select: { collectionId: true },
      });
      const watchingCollectionIds = [...new Set(inProgressContents.map((c) => c.collectionId))];

      const candidates = await prisma.content.findMany({
        where: {
          role: { in: ["SHORT", "FULL"] },
          id: completedContentIds.length > 0 ? { notIn: completedContentIds } : undefined,
          OR: [
            { role: "SHORT", outgoingWarps: { some: {} } },
            { role: "FULL", sourceUrl: { not: null } },
          ],
        },
        include: {
          collection: {
            select: {
              title: true,
              coverUrl: true,
              fullMode: true,
              primaryEmotion: true,
            },
          },
          outgoingWarps: {
            include: {
              targetContent: {
                select: { id: true, title: true, order: true },
              },
            },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return { candidates, watchingCollectionIds };
    },

    /** Fetch user's emotion reaction history for personalized scoring. */
    // Aggregates past reaction history into an emotion preference histogram.
    async getUserEmotionPreferences(userId: string) {
      const reactions = await prisma.userReaction.findMany({
        where: { userId },
        select: { emotion: true },
      });
      const counts: Record<string, number> = {};
      for (const r of reactions) {
        counts[r.emotion] = (counts[r.emotion] ?? 0) + 1;
      }
      return counts;
    },

    /** Record feed impressions for mixed short/long content items. */
    // Persists impression analytics for feed items served to the client.
    async recordImpressions(
      userId: string,
      items: Array<{ itemType: "SHORT" | "LONG"; contentId: string; fullContentId: string | null }>
    ) {
      if (items.length === 0) return;
      await prisma.feedEvent.createMany({
        data: items.map((item) => ({
          userId,
          contentId: item.contentId,
          targetContentId: item.itemType === "SHORT" ? item.fullContentId : undefined,
          eventType: "IMPRESSION" as const,
        })),
      });
    },
  };
}

export type FeedRepository = ReturnType<typeof createFeedRepository>;
