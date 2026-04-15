// Service layer for creating and summarizing reaction data.
import type { TargetType, Emotion } from "@podkaap/db";
import { toReactionDto } from "./reactions.mapper";
import { createReactionsRepository } from "./reactions.repository";
import type { PrismaClient } from "@podkaap/db";

// Creates reaction use cases bound to a Prisma client instance.
export function createReactionsService(prisma: PrismaClient) {
  const repo = createReactionsRepository(prisma);

  return {
    // Creates one user reaction against a target entity.
    async create(userId: string, targetId: string, targetType: TargetType, emotion: Emotion) {
      const reaction = await repo.create(userId, targetId, targetType, emotion);
      return toReactionDto(reaction);
    },

    // Lists reactions for one target entity.
    async getByTarget(targetId: string, targetType: TargetType) {
      const reactions = await repo.findByTarget(targetId, targetType);
      return reactions.map(toReactionDto);
    },

    // Aggregates reaction counts for a full content target.
    async summarizeForContent(contentId: string) {
      return repo.summarizeByContent(contentId);
    },
  };
}
