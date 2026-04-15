// Storage abstraction used by API-facing modules that need upload semantics.
import { Elysia } from "elysia";
import { appConfig } from "../config/app-config";

export interface StorageService {
  upload(buffer: Buffer, filename: string, folder?: string): Promise<string>;
  delete(publicId: string): Promise<void>;
  getUrl(publicId: string): string;
}

// ---------------------------------------------------------------------------
// Mock implementation (replace with real Cloudinary/S3 SDK calls)
// ---------------------------------------------------------------------------
class MockStorageService implements StorageService {
  // Returns a fake URL so the API can continue working without real storage.
  async upload(_buffer: Buffer, filename: string, folder = "uploads"): Promise<string> {
    // In production replace with actual upload logic
    console.warn("[storage] Using mock storage — file not actually uploaded");
    return `https://example.com/${folder}/${filename}`;
  }

  // Mock delete keeps the storage contract intact in non-production flows.
  async delete(_publicId: string): Promise<void> {
    console.warn("[storage] Mock delete — no-op");
  }

  // Generates a deterministic mock URL for read operations.
  getUrl(publicId: string): string {
    return `https://example.com/${publicId}`;
  }
}

class CloudinaryStorageService implements StorageService {
  // Placeholder upload method until Cloudinary SDK integration is implemented.
  async upload(_buffer: Buffer, filename: string, folder = "uploads"): Promise<string> {
    // TODO: integrate cloudinary SDK
    // const result = await cloudinary.uploader.upload_stream(...)
    throw new Error(`Cloudinary upload not yet implemented. filename=${filename} folder=${folder}`);
  }

  // Placeholder delete method for future Cloudinary integration.
  async delete(_publicId: string): Promise<void> {
    // TODO: cloudinary.uploader.destroy(publicId)
  }

  // Builds a Cloudinary delivery URL from the configured cloud name.
  getUrl(publicId: string): string {
    const cloud = appConfig.storage.cloudinary.cloudName;
    return `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`;
  }
}

// Chooses the storage implementation that should back the current runtime.
function createStorageService(): StorageService {
  if (appConfig.server.nodeEnv === "test" || !appConfig.storage.cloudinary.cloudName) {
    return new MockStorageService();
  }
  if (appConfig.storage.provider === "cloudinary") {
    return new CloudinaryStorageService();
  }
  // S3 implementation placeholder
  return new MockStorageService();
}

export const storagePlugin = new Elysia({ name: "storage" }).decorate(
  "storage",
  createStorageService()
);
