// Prisma queries for analytics event ingestion.
import type { PrismaClient, FeedEventType } from "@podkaap/db";

interface EventInput {
  userId: string;
  eventType: FeedEventType;
  contentId: string;
  targetContentId?: string;
}

// Creates repository methods for single and batch analytics writes.
export function createAnalyticsRepository(prisma: PrismaClient) {
  return {
    // Persists many analytics events in one database call.
    async createMany(events: EventInput[]) {
      return prisma.feedEvent.createMany({
        data: events.map((e) => ({
          userId: e.userId,
          eventType: e.eventType,
          contentId: e.contentId,
          targetContentId: e.targetContentId ?? null,
        })),
      });
    },

    // Persists a single analytics event row.
    async create(event: EventInput) {
      return prisma.feedEvent.create({
        data: {
          userId: event.userId,
          eventType: event.eventType,
          contentId: event.contentId,
          targetContentId: event.targetContentId ?? null,
        },
      });
    },
  };
}

export type AnalyticsRepository = ReturnType<typeof createAnalyticsRepository>;
