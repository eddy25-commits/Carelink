import { Router } from "express";
import { incidentsController } from "./incidents.controller";
import { validate } from "../../middleware/validate";
import { updateIncidentStatusSchema, listIncidentsQuerySchema } from "./incidents.validation";
import { requireAuth, requireRole } from "../../middleware/auth";

export const incidentsRouter = Router();

incidentsRouter.use(requireAuth);

incidentsRouter.get("/", validate(listIncidentsQuerySchema, "query"), incidentsController.list);
incidentsRouter.get("/:id", incidentsController.getById);
incidentsRouter.patch("/:id/status", validate(updateIncidentStatusSchema), incidentsController.updateStatus);
incidentsRouter.post(
  "/run-clustering",
  requireRole("supervisor", "admin"),
  incidentsController.runClusteringNow
);
