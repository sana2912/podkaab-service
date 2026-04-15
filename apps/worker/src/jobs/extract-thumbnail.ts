// Worker job that generates and stores a thumbnail image for a media asset.
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPrisma } from "../services/prisma.service";
import { extractThumbnail } from "../services/ffmpeg-runner";
import { uploadFile } from "../services/storage.service";
import type { ExtractThumbnailPayload } from "@podkaap/shared";

export async function extractThumbnailJob(payload: ExtractThumbnailPayload): Promise<void> {
  const prisma = getPrisma();
  const { mediaId, sourceUrl, timestampSeconds = 5 } = payload;

  console.info(`[job:extract-thumbnail] start mediaId=${mediaId}`);

  const outputPath = join(tmpdir(), `thumb-${mediaId}.jpg`);

  await extractThumbnail(sourceUrl, outputPath, timestampSeconds);

  const result = await uploadFile(outputPath, `thumbnails/${mediaId}.jpg`);

  await prisma.media.update({
    where: { id: mediaId },
    data: { thumbnailUrl: result.url },
  });

  console.info(`[job:extract-thumbnail] done mediaId=${mediaId} url=${result.url}`);
}
