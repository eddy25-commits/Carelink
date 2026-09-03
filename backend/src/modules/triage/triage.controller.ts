import { Request, Response } from "express";
import { triageService } from "./triage.service";
import { asyncHandler } from "../../utils/async-handler";

export const triageController = {
  queue: asyncHandler(async (req: Request, res: Response) => {
    const reports = await triageService.queue(req.query as never);
    res.status(200).json({ data: reports });
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const history = await triageService.history(req.params.reportId);
    res.status(200).json({ data: history });
  }),

  triage: asyncHandler(async (req: Request, res: Response) => {
    const report = await triageService.triage(req.params.reportId, req.user!.id, req.body.notes);
    res.status(200).json({ data: report });
  }),

  assign: asyncHandler(async (req: Request, res: Response) => {
    const report = await triageService.assign(req.params.reportId, req.user!.id, req.body.assigneeId, req.body.notes);
    res.status(200).json({ data: report });
  }),

  escalate: asyncHandler(async (req: Request, res: Response) => {
    const report = await triageService.escalate(req.params.reportId, req.user!.id, req.body.notes);
    res.status(200).json({ data: report });
  }),

  resolve: asyncHandler(async (req: Request, res: Response) => {
    const report = await triageService.resolve(req.params.reportId, req.user!.id, req.body.notes);
    res.status(200).json({ data: report });
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    const report = await triageService.close(req.params.reportId, req.user!.id, req.body.notes);
    res.status(200).json({ data: report });
  }),

  reopen: asyncHandler(async (req: Request, res: Response) => {
    const report = await triageService.reopen(req.params.reportId, req.user!.id, req.body.notes);
    res.status(200).json({ data: report });
  }),

  comment: asyncHandler(async (req: Request, res: Response) => {
    const report = await triageService.comment(req.params.reportId, req.user!.id, req.body.notes);
    res.status(200).json({ data: report });
  }),
};
