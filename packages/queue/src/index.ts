// Public export surface for queue connection, factories, and typed job contracts.
export { getRedisConnection, closeRedisConnection } from "./connection";
export { createMediaQueue, createAnalyticsQueue } from "./queues";
export {
  QueueName,
  MediaJobName,
  AnalyticsJobName,
} from "./job-types";
export type {
  MediaJobData,
  AnalyticsJobData,
  ProcessVideoData,
  ExtractThumbnailData,
  GenerateWaveformData,
  TranscodeVideoData,
  RecomputeScoresData,
  UpdateTrendingData,
  CleanupEventsData,
} from "./job-types";
