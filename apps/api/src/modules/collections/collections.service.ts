// Service layer for collection reads and collection-scoped content listings.
import { Errors } from "../../common/errors";
import { toCollectionContentDto, toCollectionDto } from "./collections.mapper";
import { createCollectionsRepository } from "./collections.repository";
import type { PrismaClient } from "@podkaap/db";

// Creates collection use cases bound to a Prisma client instance.
export function createCollectionsService(prisma: PrismaClient) {
  const repo = createCollectionsRepository(prisma);

  return {
    // Lists collections with cursor pagination.
    async list(cursor?: string, limit?: number) {
      const page = await repo.findMany(cursor, limit);
      return { ...page, data: page.data.map(toCollectionDto) };
    },

    // Loads a single collection by id and fails when it does not exist.
    async getById(id: string) {
      const collection = await repo.findById(id);
      if (!collection) throw Errors.notFound("Collection", id);
      return toCollectionDto(collection);
    },

    // Lists contents that belong to one collection in display-friendly order.
    async getContents(collectionId: string, cursor?: string, limit?: number) {
      const collection = await repo.findById(collectionId);
      if (!collection) throw Errors.notFound("Collection", collectionId);
      const page = await repo.findContents(collectionId, cursor, limit);
      return { ...page, data: page.data.map(toCollectionContentDto) };
    },
  };
}
