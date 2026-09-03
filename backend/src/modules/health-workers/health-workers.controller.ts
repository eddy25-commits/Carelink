import { Request, Response } from "express";
import { healthWorkersRepository } from "./health-workers.repository";
import { asyncHandler } from "../../utils/async-handler";
import { HealthWorkerRole } from "../../types/domain";

export const healthWorkersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { district, role } = req.query as { district?: string; role?: HealthWorkerRole };
    const workers = await healthWorkersRepository.list({ district, role, isActive: true });
    const publicWorkers = workers.map(({ password_hash: _password_hash, ...rest }) => rest);
    res.status(200).json({ data: publicWorkers });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const worker = await healthWorkersRepository.findById(req.user!.id);
    if (!worker) {
      res.status(404).json({ error: { message: "Health worker not found" } });
      return;
    }
    const { password_hash: _password_hash, ...publicWorker } = worker;
    res.status(200).json({ data: publicWorker });
  }),
};
