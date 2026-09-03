import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { AuthenticatedUser, HealthWorkerRole } from "../types/domain";

interface JwtPayload {
  sub: string;
  email: string;
  role: HealthWorkerRole;
}

/**
 * Requires a valid Bearer JWT for health-worker-facing routes (triage
 * dashboard, assignment, escalation, etc). Community reporters never
 * need this — they use the anonymous report-token flow instead.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user: AuthenticatedUser = { id: payload.sub, email: payload.email, role: payload.role };
    req.user = user;
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

/**
 * Restricts a route to a set of health-worker roles. Must run after
 * requireAuth. Example: requireRole('supervisor', 'admin').
 */
export function requireRole(...allowedRoles: HealthWorkerRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires one of roles: ${allowedRoles.join(", ")}`);
    }
    next();
  };
}
