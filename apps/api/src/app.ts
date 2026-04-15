// Application factory: wires global plugins, docs, routes, and error handling.
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { AppError } from "./common/errors";
import { loggerPlugin } from "./plugins/logger";
import { routes } from "./routes";

// Builds the top-level Elysia application used by the HTTP server.
export function createApp() {
  return (
    new Elysia()
      .get("/", () => ({
        name: "Podkaap API",
        status: "ok",
        docs: "/docs",
        apiBase: "/api/v1",
      }))
      .use(
        swagger({
          documentation: {
            info: {
              title: "Podkaap API",
              version: "0.1.0",
              description: "MVP streaming platform backend",
            },
          },
          path: "/docs",
        })
      )
      .use(loggerPlugin)
      // Global error handler
      .onError(({ error, set }) => {
        if (error && typeof error === "object" && "code" in error && error.code === "NOT_FOUND") {
          set.status = 404;
          return { code: "NOT_FOUND", message: "Route not found" };
        }

        if (error instanceof AppError) {
          set.status = error.statusCode;
          return error.toJSON();
        }

        // Elysia validation errors
        if (error instanceof Error && error.message.includes("Validation")) {
          set.status = 422;
          return { code: "VALIDATION_ERROR", message: error.message };
        }

        console.error("[unhandled]", error);
        set.status = 500;
        return { code: "INTERNAL_ERROR", message: "An unexpected error occurred" };
      })
      .use(routes)
  );
}

export type App = ReturnType<typeof createApp>;
