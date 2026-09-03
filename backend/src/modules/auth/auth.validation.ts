import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerHealthWorkerSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["field_worker", "triage_officer", "supervisor", "admin"]).default("field_worker"),
  language: z.string().min(2).max(10).default("en"),
  district: z.string().max(150).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterHealthWorkerInput = z.infer<typeof registerHealthWorkerSchema>;
