// Request validation schemas for analytics event ingestion.
import { t } from "elysia";
import { FeedEventType } from "@podkaap/shared";

export const trackEventBody = t.Object({
  userId: t.String(),
  eventType: t.Enum(FeedEventType),
  contentId: t.String(),
  targetContentId: t.Optional(t.String()),
});

export const trackEventsBody = t.Object({
  events: t.Array(trackEventBody, { minItems: 1, maxItems: 100 }),
});
