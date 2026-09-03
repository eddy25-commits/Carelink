import { z } from "zod";

const locationSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .optional();

export const createReportSchema = z.object({
  isAnonymous: z.boolean().default(false),
  reporterContact: z.string().min(3).max(100).optional(),
  reporterLanguage: z.string().min(2).max(10).default("en"),
  category: z.enum(["individual_symptom", "suspected_outbreak", "environmental_hazard", "other"]),
  description: z.string().min(5).max(2000),
  symptoms: z.array(z.string().min(1).max(60)).max(30).default([]),
  affectedCount: z.number().int().min(1).max(10000).default(1),
  addressText: z.string().max(255).optional(),
  location: locationSchema,
});

export const listReportsQuerySchema = z.object({
  status: z.enum(["submitted", "triaged", "assigned", "in_progress", "escalated", "resolved", "closed"]).optional(),
  priorityLevel: z.enum(["critical", "high", "medium", "low"]).optional(),
  assignedTo: z.string().uuid().optional(),
  incidentId: z.string().uuid().optional(),
  category: z.enum(["individual_symptom", "suspected_outbreak", "environmental_hazard", "other"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(["severity_desc", "sla_response_asc", "newest", "oldest"]).default("severity_desc"),
});

export const triageQueueQuerySchema = z.object({
  priorityLevel: z.enum(["critical", "high", "medium", "low"]).optional(),
  assignedTo: z.string().uuid().optional(),
  unassignedOnly: z.coerce.boolean().default(false),
});

export const assignReportSchema = z.object({
  assigneeId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export const transitionReportSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const commentReportSchema = z.object({
  notes: z.string().min(1).max(1000),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type TriageQueueQuery = z.infer<typeof triageQueueQuerySchema>;
export type AssignReportInput = z.infer<typeof assignReportSchema>;
export type TransitionReportInput = z.infer<typeof transitionReportSchema>;
export type CommentReportInput = z.infer<typeof commentReportSchema>;
