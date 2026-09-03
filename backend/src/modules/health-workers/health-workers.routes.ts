import { Router } from "express";
import { healthWorkersController } from "./health-workers.controller";
import { requireAuth } from "../../middleware/auth";

export const healthWorkersRouter = Router();

healthWorkersRouter.use(requireAuth);
healthWorkersRouter.get("/", healthWorkersController.list);
healthWorkersRouter.get("/me", healthWorkersController.me);
