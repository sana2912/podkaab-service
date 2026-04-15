// Analytics ingestion routes for client-side event tracking.
import { Elysia } from "elysia";
import { prismaPlugin } from "../../plugins/prisma";
import { createAnalyticsService } from "./analytics.service";
import { trackEventsBody } from "./analytics.schema";
import type { FeedEventType } from "@podkaap/db";

export const analyticsController = new Elysia({ prefix: "/analytics" }).use(prismaPlugin).post(
  "/events",
  async ({ prisma, body, set }) => {
    const result = await createAnalyticsService(prisma).trackEvents(
      body.events.map((e) => ({
        userId: e.userId,
        eventType: e.eventType as FeedEventType,
        contentId: e.contentId,
        targetContentId: e.targetContentId,
      }))
    );
    set.status = 202;
    return result;
  },
  { body: trackEventsBody }
);
