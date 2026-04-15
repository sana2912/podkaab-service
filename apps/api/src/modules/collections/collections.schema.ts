// Request validation schemas for collection endpoints.
import { t } from "elysia";

export const collectionIdParam = t.Object({ id: t.String() });

export const listCollectionsQuery = t.Object({
  cursor: t.Optional(t.String()),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
});
