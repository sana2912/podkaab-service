// Personalized feed routes backed by the mixed short/long content feed engine.
import { Elysia } from "elysia";
import { prismaPlugin } from "../../plugins/prisma";
import { authPlugin } from "../../plugins/auth";
import { authGuard } from "../../common/guards";
import { createFeedService } from "./feed.service";
import { feedQuery } from "./feed.schema";
import { Errors } from "../../common/errors";

export const feedController = new Elysia({ prefix: "/feed" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(authGuard)
  .get(
    "/",
    async ({ prisma, userId, query }) => {
      if (!userId) throw Errors.unauthorized();
      return createFeedService(prisma).getFeedForUser(userId, query.limit);
    },
    { query: feedQuery }
  );
