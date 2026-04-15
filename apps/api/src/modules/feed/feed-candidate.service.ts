// Candidate normalization step for the mixed short/long feed pipeline.
import type { FeedRepository } from "./feed.repository";

export type FeedItemType = "SHORT" | "LONG";

export interface FeedCandidate {
  id: string;
  itemType: FeedItemType;
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
  continueConversionScore: number;
  completionScore: number;
  recencyScore: number;
  createdAt: Date;
  isFromWatchingCollection: boolean;
}

// Converts raw repository results into normalized feed candidates for scoring.
export async function generateCandidates(
  userId: string,
  repo: FeedRepository
): Promise<FeedCandidate[]> {
  const { candidates, watchingCollectionIds } = await repo.getCandidates(userId);
  const watchingSet = new Set(watchingCollectionIds);

  return candidates.map((content) => {
    const firstWarp = content.outgoingWarps[0];
    const targetContent = firstWarp?.targetContent ?? null;

    return {
      id: content.id,
      itemType: content.role === "SHORT" ? "SHORT" : "LONG",
      collectionId: content.collectionId,
      collectionTitle: content.collection.title,
      collectionCoverUrl: content.collection.coverUrl ?? null,
      fullMode: content.collection.fullMode,
      title: content.title,
      sourceUrl: content.sourceUrl ?? null,
      durationSeconds: content.durationSeconds ?? null,
      primaryEmotion: content.primaryEmotion ?? content.collection.primaryEmotion ?? null,
      targetContentId: firstWarp?.targetContentId ?? null,
      targetStartSeconds: firstWarp?.targetStartSeconds ?? 0,
      fullContentId: content.role === "FULL" ? content.id : (targetContent?.id ?? null),
      fullContentTitle: content.role === "FULL" ? content.title : (targetContent?.title ?? null),
      fullContentOrder: content.role === "FULL" ? content.order : (targetContent?.order ?? null),
      continueConversionScore: content.continueConversionScore,
      completionScore: content.completionScore,
      recencyScore: content.recencyScore,
      createdAt: content.createdAt,
      isFromWatchingCollection: watchingSet.has(content.collectionId),
    };
  });
}
