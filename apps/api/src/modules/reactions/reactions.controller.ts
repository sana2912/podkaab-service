// Reaction routes for capturing and summarizing user emotion feedback.
import { Elysia } from "elysia";
import { prismaPlugin } from "../../plugins/prisma";
import { authPlugin } from "../../plugins/auth";
import { createReactionsService } from "./reactions.service";
import { createReactionBody, contentIdParam } from "./reactions.schema";
import { Errors } from "../../common/errors";

export const reactionsController = new Elysia()
  .use(prismaPlugin)
  .use(authPlugin)
  .post(
    "/reactions",
    async ({ prisma, userId, body, set }) => {
      if (!userId) throw Errors.unauthorized();
      const result = await createReactionsService(prisma).create(
        userId,
        body.targetId,
        body.targetType as Parameters<ReturnType<typeof createReactionsService>["create"]>[2],
        body.emotion as Parameters<ReturnType<typeof createReactionsService>["create"]>[3]
      );
      set.status = 201;
      return result;
    },
    { body: createReactionBody }
  )
  .get(
    "/contents/:id/reactions-summary",
    async ({ prisma, params }) => {
      return createReactionsService(prisma).summarizeForContent(params.id);
    },
    { params: contentIdParam }
  );
