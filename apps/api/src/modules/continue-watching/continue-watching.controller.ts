// Authenticated continue-watching routes for the canonical content-based playback model.
import { Elysia } from "elysia";
import { prismaPlugin } from "../../plugins/prisma";
import { authPlugin } from "../../plugins/auth";
import { authGuard } from "../../common/guards";
import { createContinueWatchingService } from "./continue-watching.service";
import { continueWatchingQuery } from "./continue-watching.schema";
import { Errors } from "../../common/errors";

export const continueWatchingController = new Elysia({ prefix: "/continue-watching" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(authGuard)
  .get(
    "/",
    async ({ prisma, userId, query }) => {
      if (!userId) throw Errors.unauthorized();
      return createContinueWatchingService(prisma).getForUser(userId, query.limit);
    },
    { query: continueWatchingQuery }
  );
