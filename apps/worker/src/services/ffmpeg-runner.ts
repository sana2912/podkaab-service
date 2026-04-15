// FFmpeg helper functions used by the media worker jobs.
import { env } from "../config/env";

export interface FfmpegOptions {
  inputPath: string;
  outputPath: string;
  args?: string[];
}

/**
 * Runs an FFmpeg command and returns the exit code.
 * Uses Bun.spawn for subprocess management.
 */
export async function runFfmpeg(options: FfmpegOptions): Promise<void> {
  const { inputPath, outputPath, args = [] } = options;
  const cmd = [env.ffmpegPath, "-i", inputPath, ...args, outputPath, "-y"];

  console.info(`[ffmpeg] ${cmd.join(" ")}`);

  const proc = Bun.spawn(cmd, {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`FFmpeg exited with code ${exitCode}: ${stderr}`);
  }
}

// Captures a single video frame and writes it as a thumbnail image.
export async function extractThumbnail(
  inputPath: string,
  outputPath: string,
  timestampSeconds = 5
): Promise<void> {
  await runFfmpeg({
    inputPath,
    outputPath,
    args: ["-ss", String(timestampSeconds), "-vframes", "1", "-q:v", "2"],
  });
}

// Generates a waveform preview image from an audio/video source.
export async function generateWaveform(inputPath: string, outputPath: string): Promise<void> {
  await runFfmpeg({
    inputPath,
    outputPath,
    args: [
      "-filter_complex",
      "aformat=channel_layouts=mono,compand,showwavespic=s=640x120:colors=#4CAF50",
      "-frames:v",
      "1",
    ],
  });
}

// Re-encodes a video file at the requested output resolution.
export async function transcodeVideo(
  inputPath: string,
  outputPath: string,
  resolution: "360p" | "720p" | "1080p"
): Promise<void> {
  const scaleMap = {
    "360p": "640:360",
    "720p": "1280:720",
    "1080p": "1920:1080",
  };
  await runFfmpeg({
    inputPath,
    outputPath,
    args: [
      "-vf",
      `scale=${scaleMap[resolution]}`,
      "-c:v",
      "libx264",
      "-crf",
      "23",
      "-preset",
      "fast",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
    ],
  });
}
