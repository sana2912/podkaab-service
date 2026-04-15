// Request validation schemas for media endpoints.
import { t } from "elysia";

export const createMediaBody = t.Object({
  originalUrl: t.String({ format: "uri" }),
});

export const mediaIdParam = t.Object({ id: t.String() });
