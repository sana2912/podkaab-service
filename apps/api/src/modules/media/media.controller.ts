// Media lifecycle routes for creating and processing uploaded assets.
import { Elysia } from "elysia";
import { prismaPlugin } from "../../plugins/prisma";
import { queuePlugin } from "../../plugins/queue";
import { createMediaService } from "./media.service";
import { createMediaBody, mediaIdParam } from "./media.schema";

export const mediaController = new Elysia({ prefix: "/media" })
  .use(prismaPlugin)
  .use(queuePlugin)
  .post(
    "/",
    async ({ prisma, mediaQueue, body, set }) => {
      const result = await createMediaService(prisma, mediaQueue).create(body.originalUrl);
      set.status = 201;
      return result;
    },
    { body: createMediaBody }
  )
  .post(
    "/:id/process",
    async ({ prisma, mediaQueue, params }) => {
      return createMediaService(prisma, mediaQueue).triggerProcessing(params.id);
    },
    { params: mediaIdParam }
  )
  .get(
    "/:id/status",
    async ({ prisma, mediaQueue, params }) => {
      return createMediaService(prisma, mediaQueue).getStatus(params.id);
    },
    { params: mediaIdParam }
  );
