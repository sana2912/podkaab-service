// Service layer for fetching content records and their warp mappings.
import { Errors } from "../../common/errors";
import { toContentDto, toContentWarpDto } from "./contents.mapper";
import { createContentsRepository } from "./contents.repository";
import type { PrismaClient } from "@podkaap/db";

// Creates content use cases bound to a Prisma client instance.
export function createContentsService(prisma: PrismaClient) {
  const repo = createContentsRepository(prisma);

  return {
    // Loads a single content record by id.
    async getById(id: string) {
      const content = await repo.findById(id);
      if (!content) throw Errors.notFound("Content", id);
      return toContentDto(content);
    },

    // Loads outgoing warp definitions for a short content item.
    async getWarps(id: string) {
      const content = await repo.findById(id);
      if (!content) throw Errors.notFound("Content", id);
      const warps = await repo.findWarps(id);
      return warps.map(toContentWarpDto);
    },

    // Finds the next FULL content within the same collection order.
    async getNext(id: string) {
      const content = await repo.findById(id);
      if (!content) throw Errors.notFound("Content", id);
      if (content.role !== "FULL") return null;
      const next = await repo.findNextFull(content.collectionId, content.order);
      return next ? toContentDto(next) : null;
    },
  };
}
