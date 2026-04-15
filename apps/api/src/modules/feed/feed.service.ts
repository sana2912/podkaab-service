// Feed orchestration layer that runs candidate, ranking, and diversity steps.
import { createFeedRepository } from "./feed.repository";
import { generateCandidates } from "./feed-candidate.service";
import { rankCandidates } from "./feed-ranking.service";
import { applyDiversity } from "./feed-diversity.service";
import { FEED_PAGE_SIZE } from "../../config/constants";
import type { PrismaClient } from "@podkaap/db";

export interface FeedItem {
  id: string;
  itemType: "SHORT" | "LONG";
  collectionId: string;
  collectionTitle: string;
  collectionCoverUrl: string | null;
  fullMode: "SINGLE" | "SERIES";
  title: string;
  sourceUrl: string | null;
  durationSeconds: number | null;
  primaryEmotion: string | null;
  targetContentId: string | null;
  targetStartSeconds: number;
  fullContentId: string | null;
  fullContentTitle: string | null;
  fullContentOrder: number | null;
  score: number;
}

// Creates feed use cases bound to a Prisma client instance.
export function createFeedService(prisma: PrismaClient) {
  const repo = createFeedRepository(prisma);

  return {
    // Runs the full feed pipeline for one user and returns client-ready feed items.
    async getFeedForUser(userId: string, limit = FEED_PAGE_SIZE): Promise<FeedItem[]> {
      // Step 1: Candidate generation
      const candidates = await generateCandidates(userId, repo);

      // Step 2: Rank
      const emotionPreferences = await repo.getUserEmotionPreferences(userId);
      const ranked = rankCandidates(candidates, emotionPreferences);

      // Step 3: Diversity pass
      const diverse = applyDiversity(ranked, limit);

      // Fire-and-forget impression tracking
      void repo.recordImpressions(
        userId,
        diverse.map((d) => ({
          itemType: d.itemType,
          contentId: d.id,
          fullContentId: d.fullContentId,
        }))
      );

      return diverse.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        collectionId: item.collectionId,
        collectionTitle: item.collectionTitle,
        collectionCoverUrl: item.collectionCoverUrl,
        fullMode: item.fullMode,
        title: item.title,
        sourceUrl: item.sourceUrl,
        durationSeconds: item.durationSeconds,
        primaryEmotion: item.primaryEmotion,
        targetContentId: item.targetContentId,
        targetStartSeconds: item.targetStartSeconds,
        fullContentId: item.fullContentId,
        fullContentTitle: item.fullContentTitle,
        fullContentOrder: item.fullContentOrder,
        score: Math.round(item.finalScore * 1000) / 1000,
      }));
    },
  };
}
