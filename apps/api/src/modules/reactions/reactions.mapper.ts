// Mapping helpers that convert UserReaction entities into DTOs.
import type { UserReaction } from "@podkaap/db";
import type { ReactionDto } from "@podkaap/shared";

// Maps a UserReaction entity into the shared ReactionDto shape.
export function toReactionDto(r: UserReaction): ReactionDto {
  return {
    id: r.id,
    userId: r.userId,
    targetId: r.targetId,
    targetType: r.targetType as ReactionDto["targetType"],
    emotion: r.emotion as ReactionDto["emotion"],
    createdAt: r.createdAt.toISOString(),
  };
}
