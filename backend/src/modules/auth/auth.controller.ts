import { Request, Response } from "express";
import { authService } from "./auth.service";
import { asyncHandler } from "../../utils/async-handler";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),
};
