// Worker job that generates and stores a waveform preview image.
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPrisma } from "../services/prisma.service";
import { generateWaveform } from "../services/ffmpeg-runner";
import { uploadFile } from "../services/storage.service";
import type { GenerateWaveformPayload } from "@podkaap/shared";

export async function generateWaveformJob(payload: GenerateWaveformPayload): Promise<void> {
  const prisma = getPrisma();
  const { mediaId, sourceUrl } = payload;

  console.info(`[job:generate-waveform] start mediaId=${mediaId}`);

  const outputPath = join(tmpdir(), `waveform-${mediaId}.png`);

  await generateWaveform(sourceUrl, outputPath);

  const result = await uploadFile(outputPath, `waveforms/${mediaId}.png`);

  await prisma.media.update({
    where: { id: mediaId },
    data: { waveformUrl: result.url },
  });

  console.info(`[job:generate-waveform] done mediaId=${mediaId} url=${result.url}`);
}
