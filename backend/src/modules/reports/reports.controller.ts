import { Request, Response } from "express";
import { reportsService } from "./reports.service";
import { asyncHandler } from "../../utils/async-handler";

export const reportsController = {
  // Public — community members submit reports, no auth required.
  submit: asyncHandler(async (req: Request, res: Response) => {
    const report = await reportsService.submit(req.body);
    res.status(201).json({
      data: report,
      message: "Report received. Save your reference code to check status.",
    });
  }),

  // Public — anonymous/community status lookup by report token.
  getByToken: asyncHandler(async (req: Request, res: Response) => {
    const report = await reportsService.getByToken(req.params.token);
    res.status(200).json({ data: report });
  }),

  // Health-worker-facing — authenticated.
  getById: asyncHandler(async (req: Request, res: Response) => {
    const report = await reportsService.getById(req.params.id);
    res.status(200).json({ data: report });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await reportsService.list(req.query as never);
    res.status(200).json({
      data: result.data,
      meta: {
        total: result.total,
        page: (req.query as never as { page: number }).page,
        pageSize: (req.query as never as { pageSize: number }).pageSize,
      },
    });
  }),
};
