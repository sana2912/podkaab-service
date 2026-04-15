// Request validation schemas for content endpoints.
import { t } from "elysia";

export const contentIdParam = t.Object({ id: t.String() });
export const nextContentParam = t.Object({ id: t.String() });
