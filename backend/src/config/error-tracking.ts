import * as Sentry from "@sentry/node";
import { env } from "./env";
import { logger } from "./logger";

let isInitialized = false;

/**
 * Initializes Sentry error tracking if SENTRY_DSN is configured. Safe to
 * call unconditionally at boot: with no DSN, this is a no-op and the app
 * relies on local structured logging only (see logger.ts). With a DSN,
 * every 5xx captured by the error handler, plus uncaught exceptions and
 * unhandled promise rejections, are reported with full stack traces.
 */
export function initErrorTracking(): void {
  if (!env.SENTRY_DSN) {
    logger.info("SENTRY_DSN not set, error tracking will log locally only");
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  });

  isInitialized = true;
  logger.info("Sentry error tracking initialized");
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (isInitialized) {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  }
}

export { Sentry };