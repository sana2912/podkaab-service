// Read-only collection routes for the new collection/content model.
import { Elysia } from "elysia";
import { prismaPlugin } from "../../plugins/prisma";
import { parsePagination } from "../../common/utils/pagination";
import { createCollectionsService } from "./collections.service";
import { collectionIdParam, listCollectionsQuery } from "./collections.schema";

export const collectionsController = new Elysia({ prefix: "/collections" })
  .use(prismaPlugin)
  .get(
    "/",
    async ({ prisma, query }) => {
      const { cursor, limit } = parsePagination(query);
      return createCollectionsService(prisma).list(cursor, limit);
    },
    { query: listCollectionsQuery }
  )
  .get(
    "/:id",
    async ({ prisma, params }) => {
      return createCollectionsService(prisma).getById(params.id);
    },
    { params: collectionIdParam }
  )
  .get(
    "/:id/contents",
    async ({ prisma, params, query }) => {
      const { cursor, limit } = parsePagination(query);
      return createCollectionsService(prisma).getContents(params.id, cursor, limit);
    },
    { params: collectionIdParam, query: listCollectionsQuery }
  );
