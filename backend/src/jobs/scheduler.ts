import cron, { ScheduledTask } from "node-cron";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { runSlaMonitor } from "./sla-monitor.job";
import { incidentClusteringService } from "../modules/incidents/incident-clustering.service";

let scheduledTasks: ScheduledTask[] = [];

/**
 * Starts all background jobs. Called once from server.ts at boot.
 * Each job is wrapped so a single failed run is logged but never
 * crashes the process or blocks subsequent runs.
 */
export function startScheduledJobs(): void {
  const slaTask = cron.schedule(env.SLA_MONITOR_CRON, async () => {
    try {
      await runSlaMonitor();
    } catch (err) {
      logger.error({ err }, "SLA monitor job failed");
    }
  });

  const clusteringTask = cron.schedule(env.INCIDENT_CLUSTER_CRON, async () => {
    try {
      await incidentClusteringService.runClustering();
    } catch (err) {
      logger.error({ err }, "Incident clustering job failed");
    }
  });

  scheduledTasks = [slaTask, clusteringTask];
  logger.info(
    { slaCron: env.SLA_MONITOR_CRON, clusteringCron: env.INCIDENT_CLUSTER_CRON },
    "Background jobs scheduled"
  );
}

export function stopScheduledJobs(): void {
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks = [];
}
