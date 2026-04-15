// Request validation schemas for progress endpoints.
import { t } from "elysia";

export const upsertProgressBody = t.Object({
  contentId: t.String(),
  progressSeconds: t.Number({ minimum: 0 }),
  isComplete: t.Optional(t.Boolean()),
});

export const contentIdParam = t.Object({ contentId: t.String() });
