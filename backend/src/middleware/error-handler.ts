import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../config/logger";
import { env } from "../config/env";
import { captureError } from "../config/error-tracking";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (!err.isOperational || err.statusCode >= 500) {
      logger.error({ err, path: req.path }, "Operational error");
      captureError(err, { path: req.path, statusCode: err.statusCode });
    }
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  captureError(err, { path: req.path });
  res.status(500).json({
    error: {
      message: "Internal server error",
      ...(env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
    },
  });
}
