import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("*"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),

  REPORT_TOKEN_LENGTH: z.coerce.number().default(10),

  SLA_MONITOR_CRON: z.string().default("*/5 * * * *"),
  INCIDENT_CLUSTER_CRON: z.string().default("*/15 * * * *"),
  INCIDENT_CLUSTER_RADIUS_METERS: z.coerce.number().default(1500),
  INCIDENT_CLUSTER_MIN_REPORTS: z.coerce.number().default(3),
  INCIDENT_CLUSTER_WINDOW_HOURS: z.coerce.number().default(72),

  NOTIFICATION_PROVIDER: z.enum(["log", "sms", "push"]).default("log"),

  // Report attachments (photos, PDFs of e.g. hazard/symptom evidence)
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_ATTACHMENT_SIZE_MB: z.coerce.number().default(5),
  MAX_ATTACHMENTS_PER_REPORT: z.coerce.number().default(3),

  // Error tracking (Sentry) — optional; local structured logging is used when unset.
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),

  // Prometheus-style metrics, exposed at GET /metrics when enabled.
  METRICS_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
