// Minimal request logger plugin used by the API app.
import { Elysia } from "elysia";
import { appConfig } from "../config/app-config";

export const loggerPlugin = new Elysia({ name: "logger" })
  .onRequest(({ request }) => {
    if (appConfig.server.isDev) {
      console.info(`→ ${request.method} ${new URL(request.url).pathname}`);
    }
  })
  .onAfterHandle({ as: "global" }, ({ request, set }) => {
    const status = typeof set.status === "number" ? set.status : 200;
    const path = new URL(request.url).pathname;
    console.info(`← ${request.method} ${path} ${status}`);
  })
  .onError({ as: "global" }, ({ request, error }) => {
    const path = new URL(request.url).pathname;
    if (error && typeof error === "object" && "code" in error && error.code === "NOT_FOUND") {
      console.info(`↳ ${request.method} ${path} 404`);
      return;
    }
    console.error(`✗ ${request.method} ${path}`, error);
  });
