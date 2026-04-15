// Service layer that bridges media records with background processing jobs.
import { Errors } from "../../common/errors";
import { createMediaRepository } from "./media.repository";
import { MediaJobName } from "@podkaap/queue";
import type { PrismaClient } from "@podkaap/db";
import type { MediaDto } from "@podkaap/shared";
import type { Media } from "@podkaap/db";
import type { Queue } from "bullmq";
import type { MediaJobData } from "@podkaap/queue";

// Maps a Media entity into the public MediaDto response shape.
function toMediaDto(m: Media): MediaDto {
  return {
    id: m.id,
    originalUrl: m.originalUrl,
    processedUrl: m.processedUrl ?? null,
    status: m.status as MediaDto["status"],
    createdAt: m.createdAt.toISOString(),
  };
}

// Creates media use cases bound to a Prisma client and BullMQ queue.
export function createMediaService(prisma: PrismaClient, mediaQueue: Queue<MediaJobData>) {
  const repo = createMediaRepository(prisma);

  return {
    // Creates a media record before any processing work begins.
    async create(originalUrl: string): Promise<MediaDto> {
      const media = await repo.create(originalUrl);
      return toMediaDto(media);
    },

    // Marks a media item processing and enqueues the worker job.
    async triggerProcessing(id: string): Promise<MediaDto> {
      const media = await repo.findById(id);
      if (!media) throw Errors.notFound("Media", id);

      const updated = await repo.updateStatus(id, "PROCESSING");

      // Enqueue the main processing job — worker will chain thumbnail + waveform
      await mediaQueue.add(
        MediaJobName.PROCESS_VIDEO,
        { mediaId: id, sourceUrl: media.originalUrl },
        { jobId: `process-video:${id}` } // deduplicate by mediaId
      );

      console.info(`[media] Enqueued ${MediaJobName.PROCESS_VIDEO} for mediaId=${id}`);
      return toMediaDto(updated);
    },

    // Reads the latest processing state for one media item.
    async getStatus(id: string): Promise<MediaDto> {
      const media = await repo.findById(id);
      if (!media) throw Errors.notFound("Media", id);
      return toMediaDto(media);
    },
  };
}
