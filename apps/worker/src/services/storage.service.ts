// Worker-side storage upload abstraction for processed media artifacts.
import { env } from "../config/env";

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload a local file to the configured storage provider.
 * Returns the public URL.
 */
export async function uploadFile(localPath: string, destination: string): Promise<UploadResult> {
  if (env.storageProvider === "cloudinary") {
    return uploadToCloudinary(localPath, destination);
  }
  return uploadToS3(localPath, destination);
}

// Mock Cloudinary upload used until the real SDK integration is added.
async function uploadToCloudinary(localPath: string, destination: string): Promise<UploadResult> {
  // TODO: integrate cloudinary Node SDK
  // const cloudinary = require('cloudinary').v2;
  // const result = await cloudinary.uploader.upload(localPath, { public_id: destination });
  console.warn(`[storage] Mock Cloudinary upload: ${localPath} → ${destination}`);
  return {
    url: `https://res.cloudinary.com/demo/video/upload/${destination}`,
    publicId: destination,
  };
}

// Mock S3 upload used until the real SDK integration is added.
async function uploadToS3(localPath: string, destination: string): Promise<UploadResult> {
  // TODO: integrate AWS SDK v3 or compatible S3 client
  console.warn(`[storage] Mock S3 upload: ${localPath} → ${destination}`);
  const bucket = env.s3Bucket ?? "podkaap";
  return {
    url: `https://${bucket}.s3.amazonaws.com/${destination}`,
    publicId: destination,
  };
}
