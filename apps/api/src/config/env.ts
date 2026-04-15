// Environment parsing helpers for the API app.
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
  nodeEnv: optional("NODE_ENV", "development") as "development" | "production" | "test",
  port: optionalNumber("PORT", 3000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  dragonflyUrl: optional("DRAGONFLY_URL", optional("REDIS_URL", "redis://localhost:6379")),
  storageProvider: optional("STORAGE_PROVIDER", "cloudinary") as "cloudinary" | "s3",
  cloudinaryUrl: process.env["CLOUDINARY_URL"],
  cloudinaryCloudName: process.env["CLOUDINARY_CLOUD_NAME"],
  cloudinaryApiKey: process.env["CLOUDINARY_API_KEY"],
  cloudinaryApiSecret: process.env["CLOUDINARY_API_SECRET"],
  s3Endpoint: process.env["S3_ENDPOINT"],
  s3Bucket: process.env["S3_BUCKET"],
  s3AccessKeyId: process.env["S3_ACCESS_KEY_ID"],
  s3SecretAccessKey: process.env["S3_SECRET_ACCESS_KEY"],
  s3Region: optional("S3_REGION", "us-east-1"),
} as const;
