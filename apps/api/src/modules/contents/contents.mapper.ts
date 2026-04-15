// Mapping helpers that convert content entities into public DTOs.
import type { Content, ContentWarp } from "@podkaap/db";
import type {
  ContentDto,
  ContentWarpDto,
  ContentRole,
  PlaybackKind,
  Emotion,
} from "@podkaap/shared";

// Maps a Content entity into the shared ContentDto shape.
export function toContentDto(content: Content): ContentDto {
  return {
    id: content.id,
    collectionId: content.collectionId,
    mediaId: content.mediaId ?? null,
    title: content.title,
    description: content.description ?? null,
    role: content.role as ContentRole,
    playbackKind: content.playbackKind as PlaybackKind,
    order: content.order,
    sourceUrl: content.sourceUrl ?? null,
    durationSeconds: content.durationSeconds ?? null,
    primaryEmotion: (content.primaryEmotion as Emotion) ?? null,
    createdAt: content.createdAt.toISOString(),
    updatedAt: content.updatedAt.toISOString(),
  };
}

// Maps a ContentWarp entity into the shared ContentWarpDto shape.
export function toContentWarpDto(warp: ContentWarp): ContentWarpDto {
  return {
    id: warp.id,
    shortContentId: warp.shortContentId,
    targetContentId: warp.targetContentId,
    targetStartSeconds: warp.targetStartSeconds,
    createdAt: warp.createdAt.toISOString(),
  };
}
