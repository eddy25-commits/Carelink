import client from "prom-client";
import { env } from "./env";

export const metricsRegistry = new client.Registry();

if (env.METRICS_ENABLED) {
  // Standard process/runtime metrics: memory, CPU, event loop lag, GC, open handles.
  client.collectDefaultMetrics({ register: metricsRegistry, prefix: "carelink_" });
}

export const httpRequestDuration = new client.Histogram({
  name: "carelink_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const httpRequestsTotal = new client.Counter({
  name: "carelink_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

export const httpErrorsTotal = new client.Counter({
  name: "carelink_http_errors_total",
  help: "Total number of HTTP requests that resulted in a 4xx or 5xx response",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

// Domain level counters, useful for dashboards beyond raw HTTP traffic.
export const reportsSubmittedTotal = new client.Counter({
  name: "carelink_reports_submitted_total",
  help: "Total number of health reports submitted",
  labelNames: ["priority_level", "category"],
  registers: [metricsRegistry],
});

export const slaBreachesTotal = new client.Counter({
  name: "carelink_sla_breaches_total",
  help: "Total number of SLA breaches detected by the SLA monitor job",
  labelNames: ["breach_type"],
  registers: [metricsRegistry],
});

export const incidentsDetectedTotal = new client.Counter({
  name: "carelink_incidents_detected_total",
  help: "Total number of incidents created by the clustering job",
  registers: [metricsRegistry],
});