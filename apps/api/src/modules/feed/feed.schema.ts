// Request validation schema for feed queries.
import { t } from "elysia";
import { Emotion } from "@podkaap/shared";

export const feedQuery = t.Object({
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
  cursor: t.Optional(t.String()),
  emotion: t.Optional(t.Enum(Emotion)),
});
