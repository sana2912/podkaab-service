// Worker job that transcodes media into a specific resolution and uploads it.
import { tmpdir } from "node:os";
import { join } from "node:path";
import { transcodeVideo } from "../services/ffmpeg-runner";
import { uploadFile } from "../services/storage.service";
import type { TranscodeVideoPayload } from "@podkaap/shared";

export async function transcodeVideoJob(payload: TranscodeVideoPayload): Promise<string> {
  const { mediaId, sourceUrl, targetResolution } = payload;

  console.info(`[job:transcode-video] start mediaId=${mediaId} res=${targetResolution}`);

  const outputPath = join(tmpdir(), `transcode-${mediaId}-${targetResolution}.mp4`);

  await transcodeVideo(sourceUrl, outputPath, targetResolution);

  const result = await uploadFile(outputPath, `transcoded/${mediaId}/${targetResolution}.mp4`);

  console.info(`[job:transcode-video] done mediaId=${mediaId} url=${result.url}`);
  return result.url;
}
