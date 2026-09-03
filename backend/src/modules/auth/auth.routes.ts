import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { loginSchema, registerHealthWorkerSchema } from "./auth.validation";
import { authLimiter } from "../../middleware/rate-limit";
import { requireAuth, requireRole } from "../../middleware/auth";

export const authRouter = Router();

authRouter.post("/login", authLimiter, validate(loginSchema), authController.login);

// Only an existing admin can provision new health-worker accounts.
authRouter.post(
  "/register",
  requireAuth,
  requireRole("admin"),
  validate(registerHealthWorkerSchema),
  authController.register
);
