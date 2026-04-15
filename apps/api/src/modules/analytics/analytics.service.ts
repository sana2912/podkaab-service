// Service layer for writing analytics events into persistent storage.
import { createAnalyticsRepository } from "./analytics.repository";
import type { PrismaClient, FeedEventType } from "@podkaap/db";

interface EventInput {
  userId: string;
  eventType: FeedEventType;
  contentId: string;
  targetContentId?: string;
}

// Creates analytics use cases bound to a Prisma client instance.
export function createAnalyticsService(prisma: PrismaClient) {
  const repo = createAnalyticsRepository(prisma);

  return {
    // Writes a batch of analytics events and reports how many were stored.
    async trackEvents(events: EventInput[]) {
      const result = await repo.createMany(events);
      return { tracked: result.count };
    },

    // Writes a single analytics event and returns a small ack payload.
    async trackEvent(event: EventInput) {
      await repo.create(event);
      return { tracked: 1 };
    },
  };
}
