// Prisma queries for media records and processing status transitions.
import type { PrismaClient, MediaStatus } from "@podkaap/db";

// Creates repository methods for media persistence and lookup.
export function createMediaRepository(prisma: PrismaClient) {
  return {
    // Creates a new media row in pending state.
    async create(originalUrl: string) {
      return prisma.media.create({
        data: { originalUrl, status: "PENDING" },
      });
    },

    // Reads a media row by primary id.
    async findById(id: string) {
      return prisma.media.findUnique({ where: { id } });
    },

    // Updates processing status and optionally attaches output metadata.
    async updateStatus(
      id: string,
      status: MediaStatus,
      processedUrl?: string,
      errorMessage?: string
    ) {
      return prisma.media.update({
        where: { id },
        data: {
          status,
          ...(processedUrl && { processedUrl }),
          ...(errorMessage && { errorMessage }),
        },
      });
    },
  };
}

export type MediaRepository = ReturnType<typeof createMediaRepository>;
