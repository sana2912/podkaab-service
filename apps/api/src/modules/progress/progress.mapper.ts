// Mapping helpers that convert UserProgress entities into DTOs.
import type { UserProgress } from "@podkaap/db";
import type { ProgressDto } from "@podkaap/shared";

// Maps a UserProgress entity into the shared ProgressDto shape.
export function toProgressDto(p: UserProgress): ProgressDto {
  return {
    id: p.id,
    userId: p.userId,
    contentId: p.contentId,
    progressSeconds: p.progressSeconds,
    isComplete: p.isComplete,
    lastWatchedAt: p.lastWatchedAt.toISOString(),
  };
}
