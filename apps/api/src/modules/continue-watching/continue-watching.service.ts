// Service layer for building the content-based continue-watching rail response.
import { createContinueWatchingRepository } from "./continue-watching.repository";
import type { PrismaClient } from "@podkaap/db";

// Creates continue-watching use cases bound to a Prisma client instance.
export function createContinueWatchingService(prisma: PrismaClient) {
  const repo = createContinueWatchingRepository(prisma);

  return {
    // Builds the continue-watching rail for one user from in-progress full contents.
    async getForUser(userId: string, limit?: number) {
      const items = await repo.findInProgress(userId, limit);
      return items.map(({ progress, content }) => ({
        contentId: content.id,
        contentTitle: content.title,
        collectionId: content.collectionId,
        collectionTitle: content.collection.title,
        collectionCoverUrl: content.collection.coverUrl ?? null,
        fullMode: content.collection.fullMode,
        playbackKind: content.playbackKind,
        sourceUrl: content.sourceUrl ?? null,
        progressSeconds: progress.progressSeconds,
        durationSeconds: content.durationSeconds ?? null,
        percentComplete:
          content.durationSeconds && content.durationSeconds > 0
            ? Math.round((progress.progressSeconds / content.durationSeconds) * 100)
            : 0,
        lastWatchedAt: progress.lastWatchedAt.toISOString(),
      }));
    },
  };
}
