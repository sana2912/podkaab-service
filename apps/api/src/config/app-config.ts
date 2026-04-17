// Derived application config assembled from validated environment variables.
import { env } from "./env";

export const appConfig = {
  server: {
    port: env.port,
    nodeEnv: env.nodeEnv,
    isDev: env.nodeEnv === "development",
    isProd: env.nodeEnv === "production",
  },
  db: {
    url: env.databaseUrl,
  },
  auth: {
    jwtSecret: env.jwtSecret,
  },
  feedService: {
    enabled: env.feedServiceEnabled,
    url: env.feedServiceUrl,
    timeoutMs: env.feedServiceTimeoutMs,
  },
  storage: {
    provider: env.storageProvider,
    cloudinary: {
      url: env.cloudinaryUrl,
      cloudName: env.cloudinaryCloudName,
      apiKey: env.cloudinaryApiKey,
      apiSecret: env.cloudinaryApiSecret,
    },
    s3: {
      endpoint: env.s3Endpoint,
      bucket: env.s3Bucket,
      accessKeyId: env.s3AccessKeyId,
      secretAccessKey: env.s3SecretAccessKey,
      region: env.s3Region,
    },
  },
} as const;
