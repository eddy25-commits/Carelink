import { NextFunction, Request, Response } from "express";
import { httpRequestDuration, httpRequestsTotal, httpErrorsTotal } from "../config/metrics";
import { env } from "../config/env";

/**
 * Records duration, count, and error rate for every request, labeled by
 * the matched route pattern (not the raw URL, so /reports/:id does not
 * explode into one metric series per report). Must run after the router
 * has matched, so route labeling reads req.route where available.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!env.METRICS_ENABLED) {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = (req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path) || "unknown";
    const labels = { method: req.method, route, status_code: String(res.statusCode) };

    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
    if (res.statusCode >= 400) {
      httpErrorsTotal.inc(labels);
    }
  });

  next();
}