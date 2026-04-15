// Mapping helpers that convert Prisma collection models into public DTOs.
import type { Collection, Content } from "@podkaap/db";
import type {
  CollectionDto,
  ContentDto,
  CollectionFullMode,
  Emotion,
  ContentRole,
  PlaybackKind,
} from "@podkaap/shared";

// Maps a Collection entity into the shared CollectionDto response shape.
export function toCollectionDto(collection: Collection): CollectionDto {
  return {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    coverUrl: collection.coverUrl ?? null,
    fullMode: collection.fullMode as CollectionFullMode,
    primaryEmotion: (collection.primaryEmotion as Emotion) ?? null,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

// Maps a Content entity into the shared ContentDto shape for collection children.
export function toCollectionContentDto(content: Content): ContentDto {
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
