import { Router } from "express";
import { triageController } from "./triage.controller";
import { validate } from "../../middleware/validate";
import { assignReportSchema, transitionReportSchema, commentReportSchema, triageQueueQuerySchema } from "../reports/reports.validation";
import { requireAuth } from "../../middleware/auth";

export const triageRouter = Router();

triageRouter.use(requireAuth);

triageRouter.get("/queue", validate(triageQueueQuerySchema, "query"), triageController.queue);
triageRouter.get("/:reportId/history", triageController.history);

triageRouter.post("/:reportId/triage", validate(transitionReportSchema), triageController.triage);
triageRouter.post("/:reportId/assign", validate(assignReportSchema), triageController.assign);
triageRouter.post("/:reportId/escalate", validate(transitionReportSchema), triageController.escalate);
triageRouter.post("/:reportId/resolve", validate(transitionReportSchema), triageController.resolve);
triageRouter.post("/:reportId/close", validate(transitionReportSchema), triageController.close);
triageRouter.post("/:reportId/reopen", validate(transitionReportSchema), triageController.reopen);
triageRouter.post("/:reportId/comment", validate(commentReportSchema), triageController.comment);
