// Read-only content routes for content details and warp resolution.
import { Elysia } from "elysia";
import { prismaPlugin } from "../../plugins/prisma";
import { createContentsService } from "./contents.service";
import { contentIdParam, nextContentParam } from "./contents.schema";

export const contentsController = new Elysia({ prefix: "/contents" })
  .use(prismaPlugin)
  .get(
    "/:id",
    async ({ prisma, params }) => {
      return createContentsService(prisma).getById(params.id);
    },
    { params: contentIdParam }
  )
  .get(
    "/:id/warps",
    async ({ prisma, params }) => {
      return createContentsService(prisma).getWarps(params.id);
    },
    { params: contentIdParam }
  )
  .get(
    "/:id/next",
    async ({ prisma, params }) => {
      return createContentsService(prisma).getNext(params.id);
    },
    { params: nextContentParam }
  );
