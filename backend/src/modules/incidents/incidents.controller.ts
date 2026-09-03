import { Request, Response } from "express";
import { incidentsRepository } from "./incidents.repository";
import { incidentClusteringService } from "./incident-clustering.service";
import { reportsRepository } from "../reports/reports.repository";
import { asyncHandler } from "../../utils/async-handler";
import { NotFoundError } from "../../utils/errors";
import { IncidentStatus } from "../../types/domain";

export const incidentsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as IncidentStatus | undefined;
    const incidents = await incidentsRepository.list(status);
    res.status(200).json({ data: incidents });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const incident = await incidentsRepository.findById(req.params.id);
    if (!incident) throw new NotFoundError("Incident");
    const reports = await reportsRepository.list({
      incidentId: incident.id,
      page: 1,
      pageSize: 100,
      sort: "newest",
    } as never);
    res.status(200).json({ data: { ...incident, reports: reports.data } });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const incident = await incidentsRepository.updateStatus(req.params.id, req.body.status);
    res.status(200).json({ data: incident });
  }),

  // Manual trigger — useful for demos/testing without waiting for the cron interval.
  runClusteringNow: asyncHandler(async (_req: Request, res: Response) => {
    const result = await incidentClusteringService.runClustering();
    res.status(200).json({ data: result });
  }),
};
