// Shared DTOs and payload contracts used across the monorepo.
import type {
  CollectionFullMode,
  ContentRole,
  Emotion,
  FeedEventType,
  MediaStatus,
  PlaybackKind,
  TargetType,
} from "../enums";

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Common response shapes
// ---------------------------------------------------------------------------
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Domain DTOs (shared between api & worker)
// ---------------------------------------------------------------------------
export interface CollectionDto {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  fullMode: CollectionFullMode;
  primaryEmotion: Emotion | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentDto {
  id: string;
  collectionId: string;
  mediaId: string | null;
  title: string;
  description: string | null;
  role: ContentRole;
  playbackKind: PlaybackKind;
  order: number;
  sourceUrl: string | null;
  durationSeconds: number | null;
  primaryEmotion: Emotion | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentWarpDto {
  id: string;
  shortContentId: string;
  targetContentId: string;
  targetStartSeconds: number;
  createdAt: string;
}

export interface ProgressDto {
  id: string;
  userId: string;
  contentId: string;
  progressSeconds: number;
  isComplete: boolean;
  lastWatchedAt: string;
}

export interface ReactionDto {
  id: string;
  userId: string;
  targetId: string;
  targetType: TargetType;
  emotion: Emotion;
  createdAt: string;
}

export interface FeedEventDto {
  userId: string;
  contentId: string;
  targetContentId?: string;
  eventType: FeedEventType;
}

export interface MediaDto {
  id: string;
  originalUrl: string;
  processedUrl: string | null;
  status: MediaStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Worker job payloads
// ---------------------------------------------------------------------------
export interface ProcessVideoPayload {
  mediaId: string;
  sourceUrl: string;
}

export interface ExtractThumbnailPayload {
  mediaId: string;
  sourceUrl: string;
  timestampSeconds?: number;
}

export interface GenerateWaveformPayload {
  mediaId: string;
  sourceUrl: string;
}

export interface TranscodeVideoPayload {
  mediaId: string;
  sourceUrl: string;
  targetResolution: "360p" | "720p" | "1080p";
}
