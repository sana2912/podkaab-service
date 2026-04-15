// Environment parsing helpers for the background worker process.
function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

// Reads an optional env var and falls back to a default string value.
function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

// Reads an optional numeric env var and validates number conversion.
function optionalNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`Env var ${key} must be a number, got: ${raw}`);
  return n;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  dragonflyUrl: optional("DRAGONFLY_URL", optional("REDIS_URL", "redis://localhost:6379")),
  nodeEnv: optional("NODE_ENV", "development"),
  workerConcurrency: optionalNumber("WORKER_CONCURRENCY", 2),
  ffmpegPath: optional("FFMPEG_PATH", "ffmpeg"),
  storageProvider: optional("STORAGE_PROVIDER", "cloudinary") as "cloudinary" | "s3",
  cloudinaryUrl: process.env["CLOUDINARY_URL"],
  s3Endpoint: process.env["S3_ENDPOINT"],
  s3Bucket: process.env["S3_BUCKET"],
} as const;
