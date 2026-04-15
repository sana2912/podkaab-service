// Worker process entrypoint: consumes BullMQ jobs for media and analytics work.
import { Worker, type Job } from "bullmq";
import {
  getRedisConnection,
  closeRedisConnection,
  createMediaQueue,
  QueueName,
  MediaJobName,
  AnalyticsJobName,
} from "@podkaap/queue";
import type {
  MediaJobData,
  AnalyticsJobData,
  ProcessVideoData,
  ExtractThumbnailData,
  GenerateWaveformData,
  TranscodeVideoData,
} from "@podkaap/queue";

import { env } from "./config/env";
import { disconnectPrisma } from "./services/prisma.service";
import { processVideo } from "./jobs/process-video";
import { extractThumbnailJob } from "./jobs/extract-thumbnail";
import { generateWaveformJob } from "./jobs/generate-waveform";
import { transcodeVideoJob } from "./jobs/transcode-video";
import { recomputeContentScores, updateTrending, cleanup } from "./jobs/analytics";

// ---------------------------------------------------------------------------
// Media queue processor
// ---------------------------------------------------------------------------
async function processMediaJob(job: Job<MediaJobData>): Promise<void> {
  const { name, data } = job;

  switch (name) {
    case MediaJobName.PROCESS_VIDEO: {
      const d = data as ProcessVideoData;
      await processVideo(d);

      // Chain thumbnail + waveform as follow-up jobs
      const mediaQueue = createMediaQueue();
      await Promise.all([
        mediaQueue.add(
          MediaJobName.EXTRACT_THUMBNAIL,
          {
            mediaId: d.mediaId,
            sourceUrl: d.sourceUrl,
          },
          { jobId: `thumbnail:${d.mediaId}` }
        ),

        mediaQueue.add(
          MediaJobName.GENERATE_WAVEFORM,
          {
            mediaId: d.mediaId,
            sourceUrl: d.sourceUrl,
          },
          { jobId: `waveform:${d.mediaId}` }
        ),
      ]);
      await mediaQueue.close();
      break;
    }

    case MediaJobName.EXTRACT_THUMBNAIL:
      await extractThumbnailJob(data as ExtractThumbnailData);
      break;

    case MediaJobName.GENERATE_WAVEFORM:
      await generateWaveformJob(data as GenerateWaveformData);
      break;

    case MediaJobName.TRANSCODE_VIDEO:
      await transcodeVideoJob(data as TranscodeVideoData);
      break;

    default:
      throw new Error(`Unknown media job: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Analytics queue processor
// ---------------------------------------------------------------------------
async function processAnalyticsJob(job: Job<AnalyticsJobData>): Promise<void> {
  switch (job.name) {
    case AnalyticsJobName.RECOMPUTE_SCORES:
      await recomputeContentScores();
      break;

    case AnalyticsJobName.UPDATE_TRENDING:
      await updateTrending();
      break;

    case AnalyticsJobName.CLEANUP_EVENTS:
      await cleanup();
      break;

    default:
      throw new Error(`Unknown analytics job: ${job.name}`);
  }
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
// Boots queue workers, wires event handlers, and manages graceful shutdown.
async function main() {
  console.info(
    `🔧 Podkaap Worker started  concurrency=${env.workerConcurrency}  dragonfly=${env.dragonflyUrl}`
  );

  const connection = getRedisConnection();

  const mediaWorker = new Worker<MediaJobData>(QueueName.MEDIA, processMediaJob, {
    connection,
    concurrency: env.workerConcurrency,
  });

  const analyticsWorker = new Worker<AnalyticsJobData>(QueueName.ANALYTICS, processAnalyticsJob, {
    connection,
    concurrency: 1, // analytics jobs are write-heavy, keep serial
  });

  // ---------------------------------------------------------------------------
  // Event logging
  // ---------------------------------------------------------------------------
  for (const [worker, label] of [
    [mediaWorker, "media"] as const,
    [analyticsWorker, "analytics"] as const,
  ]) {
    worker.on("completed", (job) => {
      console.info(`[${label}] ✓ job=${job.name} id=${job.id}`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[${label}] ✗ job=${job?.name} id=${job?.id}`, err.message);
    });

    worker.on("error", (err) => {
      console.error(`[${label}] worker error`, err);
    });
  }

  // ---------------------------------------------------------------------------
  // Graceful shutdown
  // ---------------------------------------------------------------------------
  const shutdown = async (signal: string) => {
    console.info(`[worker] ${signal} received — shutting down gracefully`);
    await Promise.all([mediaWorker.close(), analyticsWorker.close()]);
    await disconnectPrisma();
    await closeRedisConnection();
    console.info("[worker] Shutdown complete");
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  console.info(`[worker] Listening on queues: ${QueueName.MEDIA}, ${QueueName.ANALYTICS}`);
}

main().catch((err) => {
  console.error("[worker] Fatal error", err);
  process.exit(1);
});
