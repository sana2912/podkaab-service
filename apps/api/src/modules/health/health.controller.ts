// Lightweight health-check route for probing API and database reachability.
import { Elysia } from "elysia";
import { prismaPlugin } from "../../plugins/prisma";

export const healthController = new Elysia({ prefix: "/health" })
  .use(prismaPlugin)
  .get("/", async ({ prisma }) => {
    let dbStatus: "ok" | "error" = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    return {
      status: dbStatus === "ok" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
    };
  });
