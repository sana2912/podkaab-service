// Worker job that marks a media asset processed and stores its final URL.
import { getPrisma } from "../services/prisma.service";
import { uploadFile } from "../services/storage.service";
import type { ProcessVideoPayload } from "@podkaap/shared";

/**
 * Full video processing pipeline:
 * 1. Download source video to temp file
 * 2. Upload original to storage (if not already there)
 * 3. Mark media as READY
 */
export async function processVideo(payload: ProcessVideoPayload): Promise<void> {
  const prisma = getPrisma();
  const { mediaId, sourceUrl } = payload;

  console.info(`[job:process-video] start mediaId=${mediaId}`);

  await prisma.media.update({
    where: { id: mediaId },
    data: { status: "PROCESSING" },
  });

  try {
    // For MVP: treat the sourceUrl as already processed
    // In production: download → process → re-upload
    const result = await uploadFile(sourceUrl, `processed/${mediaId}/original`);

    await prisma.media.update({
      where: { id: mediaId },
      data: { status: "READY", processedUrl: result.url },
    });

    console.info(`[job:process-video] done mediaId=${mediaId} url=${result.url}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.media.update({
      where: { id: mediaId },
      data: { status: "FAILED", errorMessage: message },
    });
    throw err;
  }
}
