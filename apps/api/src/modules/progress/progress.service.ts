// Service layer for reading and mutating content-based user playback progress.
import { Errors } from "../../common/errors";
import { toProgressDto } from "./progress.mapper";
import { createProgressRepository } from "./progress.repository";
import type { PrismaClient } from "@podkaap/db";

// Creates progress use cases bound to a Prisma client instance.
export function createProgressService(prisma: PrismaClient) {
  const repo = createProgressRepository(prisma);

  async function assertFullContent(contentId: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { role: true },
    });
    if (!content) throw Errors.notFound("Content", contentId);
    if (content.role !== "FULL")
      throw Errors.badRequest("Progress can only be tracked for FULL content");
  }

  return {
    // Creates or updates the user's playback progress for one full content item.
    async upsert(userId: string, contentId: string, progressSeconds: number, isComplete = false) {
      await assertFullContent(contentId);
      const record = await repo.upsert(userId, contentId, progressSeconds, isComplete);
      return toProgressDto(record);
    },

    // Loads the user's progress row for one full content item.
    async getByContent(userId: string, contentId: string) {
      await assertFullContent(contentId);
      const record = await repo.findByUserAndContent(userId, contentId);
      if (!record) throw Errors.notFound("Progress");
      return toProgressDto(record);
    },

    // Marks a full content item as completed for the current user.
    async markComplete(userId: string, contentId: string) {
      await assertFullContent(contentId);
      const record = await repo.markComplete(userId, contentId);
      return toProgressDto(record);
    },
  };
}
