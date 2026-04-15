// Central API route registry mounted under /api/v1.
import { Elysia } from "elysia";
import { collectionsController } from "../modules/collections";
import { contentsController } from "../modules/contents";
import { progressController } from "../modules/progress";
import { continueWatchingController } from "../modules/continue-watching";
import { reactionsController } from "../modules/reactions";
import { feedController } from "../modules/feed";
import { analyticsController } from "../modules/analytics";
import { mediaController } from "../modules/media";
import { healthController } from "../modules/health";

export const routes = new Elysia({ prefix: "/api/v1" })
  .use(healthController)
  .use(collectionsController)
  .use(contentsController)
  .use(progressController)
  .use(continueWatchingController)
  .use(reactionsController)
  .use(feedController)
  .use(analyticsController)
  .use(mediaController);
