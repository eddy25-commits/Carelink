import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { initErrorTracking } from "./config/error-tracking";
import { checkDatabaseConnection, closeDatabaseConnection } from "./config/database";
import { startScheduledJobs, stopScheduledJobs } from "./jobs/scheduler";

async function bootstrap(): Promise<void> {
  initErrorTracking();
  await checkDatabaseConnection();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Community Health Triage API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  startScheduledJobs();

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    stopScheduledJobs();
    server.close(async () => {
      await closeDatabaseConnection();
      logger.info("Shutdown complete");
      process.exit(0);
    });

    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
