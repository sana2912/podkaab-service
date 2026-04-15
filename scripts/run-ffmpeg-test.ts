#!/usr/bin/env bun
/**
 * Smoke-test FFmpeg availability.
 * Run: bun run scripts/run-ffmpeg-test.ts
 */
import { spawn } from "bun";

const ffmpegPath = process.env["FFMPEG_PATH"] ?? "ffmpeg";
const proc = spawn([ffmpegPath, "-version"], {
  stdout: "pipe",
  stderr: "pipe",
});

const code = await proc.exited;
if (code === 0) {
  const out = await new Response(proc.stdout).text();
  const version = out.split("\n")[0] ?? "";
  console.info(`✅ FFmpeg found: ${version}`);
} else {
  const err = await new Response(proc.stderr).text();
  console.error(`❌ FFmpeg not found or failed:\n${err}`);
  process.exit(1);
}
