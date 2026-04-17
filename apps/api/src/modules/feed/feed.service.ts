// Feed orchestration layer that runs candidate, ranking, and diversity steps.
import type { PrismaClient } from "@podkaap/db";
import { appConfig } from "../../config/app-config";
import { FEED_PAGE_SIZE } from "../../config/constants";
import { createFeedRepository } from "./feed.repository";
import { generateCandidates } from "./feed-candidate.service";
import { createLocalFeedEngine } from "./feed-local-engine.service";
import { createRemoteFeedEngine } from "./feed-remote-engine.service";

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
  const localEngine = createLocalFeedEngine();
  const remoteEngine = createRemoteFeedEngine();

  return {
    // Runs the full feed pipeline for one user and returns client-ready feed items.
    async getFeedForUser(userId: string, limit = FEED_PAGE_SIZE): Promise<FeedItem[]> {
      // Step 1: Candidate generation
      const candidates = await generateCandidates(userId, repo);

      // Step 2: Build user taste context from prior reactions.
      const emotionPreferences = await repo.getUserEmotionPreferences(userId);
      let selections = [];

      // Step 3: Delegate ranking and diversity to the Python feed engine when enabled.
      if (appConfig.feedService.enabled) {
        try {
          selections = await remoteEngine.select({ candidates, emotionPreferences, limit });
          if (selections.length === 0 && candidates.length > 0) {
            selections = await localEngine.select({ candidates, emotionPreferences, limit });
          }
        } catch (error) {
          console.warn(
            "[feed] Remote feed engine unavailable, falling back to local engine",
            error
          );
          selections = await localEngine.select({ candidates, emotionPreferences, limit });
        }
      } else {
        selections = await localEngine.select({ candidates, emotionPreferences, limit });
      }

      const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
      const selectedItems = selections.flatMap((selection) => {
        const candidate = candidateById.get(selection.contentId);
        return candidate ? [{ candidate, selection }] : [];
      });

      // Fire-and-forget impression tracking
      void repo.recordImpressions(
        userId,
        selectedItems.map(({ candidate }) => ({
          itemType: candidate.itemType,
          contentId: candidate.id,
          fullContentId: candidate.fullContentId,
        }))
      );

      return selectedItems.map(({ candidate, selection }) => ({
        id: candidate.id,
        itemType: candidate.itemType,
        collectionId: candidate.collectionId,
        collectionTitle: candidate.collectionTitle,
        collectionCoverUrl: candidate.collectionCoverUrl,
        fullMode: candidate.fullMode,
        title: candidate.title,
        sourceUrl: candidate.sourceUrl,
        durationSeconds: candidate.durationSeconds,
        primaryEmotion: candidate.primaryEmotion,
        targetContentId: candidate.targetContentId,
        targetStartSeconds: candidate.targetStartSeconds,
        fullContentId: candidate.fullContentId,
        fullContentTitle: candidate.fullContentTitle,
        fullContentOrder: candidate.fullContentOrder,
        score: Math.round(selection.score * 1000) / 1000,
      }));
    },
  };
}
