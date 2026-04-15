// Request validation schemas for reaction endpoints.
import { t } from "elysia";
import { Emotion, TargetType } from "@podkaap/shared";

export const createReactionBody = t.Object({
  targetId: t.String(),
  targetType: t.Enum(TargetType),
  emotion: t.Enum(Emotion),
});

export const contentIdParam = t.Object({ id: t.String() });
