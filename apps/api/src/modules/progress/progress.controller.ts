// Authenticated progress routes for the canonical content-based playback model.
import { Elysia } from "elysia";
import { prismaPlugin } from "../../plugins/prisma";
import { authPlugin } from "../../plugins/auth";
import { authGuard } from "../../common/guards";
import { createProgressService } from "./progress.service";
import { upsertProgressBody, contentIdParam } from "./progress.schema";
import { Errors } from "../../common/errors";

export const progressController = new Elysia({ prefix: "/progress" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(authGuard)
  .post(
    "/",
    async ({ prisma, userId, body, set }) => {
      if (!userId) throw Errors.unauthorized();
      const result = await createProgressService(prisma).upsert(
        userId,
        body.contentId,
        body.progressSeconds,
        body.isComplete
      );
      set.status = 200;
      return result;
    },
    { body: upsertProgressBody }
  )
  .get(
    "/:contentId",
    async ({ prisma, userId, params }) => {
      if (!userId) throw Errors.unauthorized();
      return createProgressService(prisma).getByContent(userId, params.contentId);
    },
    { params: contentIdParam }
  )
  .post(
    "/:contentId/complete",
    async ({ prisma, userId, params }) => {
      if (!userId) throw Errors.unauthorized();
      return createProgressService(prisma).markComplete(userId, params.contentId);
    },
    { params: contentIdParam }
  );
