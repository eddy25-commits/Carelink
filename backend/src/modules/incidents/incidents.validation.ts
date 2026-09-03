import { z } from "zod";

export const updateIncidentStatusSchema = z.object({
  status: z.enum(["active", "monitoring", "resolved"]),
});

export const listIncidentsQuerySchema = z.object({
  status: z.enum(["active", "monitoring", "resolved"]).optional(),
});
