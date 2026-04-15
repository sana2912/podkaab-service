// Request validation schema for continue-watching queries.
import { t } from "elysia";

export const continueWatchingQuery = t.Object({
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
});
