// API process entrypoint: boots the Elysia app and starts listening.
import { createApp } from "./app";
import { appConfig } from "./config/app-config";

const app = createApp();

app.listen(appConfig.server.port, () => {
  console.info(`🚀 Podkaap API running at http://localhost:${appConfig.server.port}`);
  console.info(`📖 Swagger docs at http://localhost:${appConfig.server.port}/docs`);
  console.info(`   Environment: ${appConfig.server.nodeEnv}`);
});

export type { App } from "./app";
