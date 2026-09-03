import { Router } from "express";
import { attachmentsController } from "./attachments.controller";
import { requireAuth } from "../../middleware/auth";
import { attachmentUploadLimiter } from "../../middleware/rate-limit";
import { uploadAttachmentFiles } from "../../middleware/upload";

// mergeParams so :reportId from the parent mount ("/reports/:reportId/attachments") is visible here.
export const attachmentsRouter = Router({ mergeParams: true });

// --- Public — a reporter (anonymous or not) attaches evidence using the report id they were given. ---
attachmentsRouter.post("/", attachmentUploadLimiter, uploadAttachmentFiles, attachmentsController.upload);

// --- Health-worker-facing — authenticated. ---
attachmentsRouter.get("/", requireAuth, attachmentsController.list);
attachmentsRouter.get("/:attachmentId/file", requireAuth, attachmentsController.file);
