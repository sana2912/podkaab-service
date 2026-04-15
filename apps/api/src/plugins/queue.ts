// Elysia plugin that exposes shared BullMQ queue instances to route handlers.
import { Elysia } from "elysia";
import { createMediaQueue, createAnalyticsQueue } from "@podkaap/queue";
import type { Queue } from "bullmq";
import type { MediaJobData, AnalyticsJobData } from "@podkaap/queue";

// Singletons — created once when the plugin is first used
let _mediaQueue: Queue<MediaJobData> | null = null;
let _analyticsQueue: Queue<AnalyticsJobData> | null = null;

// Lazily creates and reuses the media queue singleton for the API process.
function getMediaQueue(): Queue<MediaJobData> {
  _mediaQueue ??= createMediaQueue();
  return _mediaQueue;
}

// Lazily creates and reuses the analytics queue singleton for the API process.
function getAnalyticsQueue(): Queue<AnalyticsJobData> {
  _analyticsQueue ??= createAnalyticsQueue();
  return _analyticsQueue;
}

export const queuePlugin = new Elysia({ name: "queue" })
  .decorate("mediaQueue", getMediaQueue())
  .decorate("analyticsQueue", getAnalyticsQueue())
  .onStop(async () => {
    await Promise.all([_mediaQueue?.close(), _analyticsQueue?.close()]);
    console.info("[queue] Queues closed");
  });
