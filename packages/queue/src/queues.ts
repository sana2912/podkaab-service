// Queue factory helpers used to instantiate typed BullMQ queues.
import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";
import { QueueName } from "./job-types";
import type { MediaJobData, AnalyticsJobData } from "./job-types";

// ---------------------------------------------------------------------------
// Shared default options
// ---------------------------------------------------------------------------
const sharedDefaults = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2_000 },
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
};

// ---------------------------------------------------------------------------
// Factory functions — call once at startup, reuse the instance
// ---------------------------------------------------------------------------

// Creates the queue used for media processing jobs.
export function createMediaQueue(): Queue<MediaJobData> {
  return new Queue<MediaJobData>(QueueName.MEDIA, {
    connection: getRedisConnection(),
    defaultJobOptions: sharedDefaults,
  });
}

// Creates the queue used for analytics maintenance jobs.
export function createAnalyticsQueue(): Queue<AnalyticsJobData> {
  return new Queue<AnalyticsJobData>(QueueName.ANALYTICS, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      ...sharedDefaults,
      attempts: 2,
    },
  });
}
