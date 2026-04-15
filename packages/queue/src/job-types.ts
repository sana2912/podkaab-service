// Queue names, job names, and payload contracts shared by API and worker.
// ---------------------------------------------------------------------------
// Queue & Job name constants
// ---------------------------------------------------------------------------

export const QueueName = {
  MEDIA: "media",
  ANALYTICS: "analytics",
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

export const MediaJobName = {
  PROCESS_VIDEO: "media:process-video",
  EXTRACT_THUMBNAIL: "media:extract-thumbnail",
  GENERATE_WAVEFORM: "media:generate-waveform",
  TRANSCODE_VIDEO: "media:transcode-video",
} as const;

export type MediaJobName = (typeof MediaJobName)[keyof typeof MediaJobName];

export const AnalyticsJobName = {
  RECOMPUTE_SCORES: "analytics:recompute-scores",
  UPDATE_TRENDING: "analytics:update-trending",
  CLEANUP_EVENTS: "analytics:cleanup-events",
} as const;

export type AnalyticsJobName = (typeof AnalyticsJobName)[keyof typeof AnalyticsJobName];

// ---------------------------------------------------------------------------
// Typed job data payloads
// ---------------------------------------------------------------------------

export interface ProcessVideoData {
  mediaId: string;
  sourceUrl: string;
}

export interface ExtractThumbnailData {
  mediaId: string;
  sourceUrl: string;
  timestampSeconds?: number;
}

export interface GenerateWaveformData {
  mediaId: string;
  sourceUrl: string;
}

export interface TranscodeVideoData {
  mediaId: string;
  sourceUrl: string;
  targetResolution: "360p" | "720p" | "1080p";
}

export interface RecomputeScoresData {
  contentIds?: string[]; // undefined = all contents
}

export interface UpdateTrendingData {
  contentIds?: string[];
}

export interface CleanupEventsData {
  retentionDays?: number;
}

// ---------------------------------------------------------------------------
// Union type for all media job data (used in worker switch)
// ---------------------------------------------------------------------------
export type MediaJobData =
  | ProcessVideoData
  | ExtractThumbnailData
  | GenerateWaveformData
  | TranscodeVideoData;

export type AnalyticsJobData = RecomputeScoresData | UpdateTrendingData | CleanupEventsData;
