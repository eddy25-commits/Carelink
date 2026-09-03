import { Request, Response } from "express";
import { attachmentsService } from "./attachments.service";
import { asyncHandler } from "../../utils/async-handler";

export const attachmentsController = {
  // Public — a reporter attaches evidence right after submitting (before or
  // after leaving the page), identified by the report id they were given.
  upload: asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const attachments = await attachmentsService.attach(req.params.reportId, files);
    res.status(201).json({ data: attachments });
  }),

  // Health-worker-facing — authenticated.
  list: asyncHandler(async (req: Request, res: Response) => {
    const attachments = await attachmentsService.listForReport(req.params.reportId);
    res.status(200).json({ data: attachments });
  }),

  file: asyncHandler(async (req: Request, res: Response) => {
    const { absolutePath, mimeType } = await attachmentsService.resolveFile(
      req.params.reportId,
      req.params.attachmentId
    );
    res.setHeader("Content-Type", mimeType);
    res.sendFile(absolutePath);
  }),
};
