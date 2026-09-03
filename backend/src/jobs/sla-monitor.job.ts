import { reportsRepository } from "../modules/reports/reports.repository";
import { triageActionsRepository } from "../modules/triage/triage-actions.repository";
import { notificationsService } from "../modules/notifications/notifications.service";
import { logger } from "../config/logger";

/**
 * Runs periodically (see jobs/scheduler.ts) to find open reports that
 * have passed their SLA response or resolution deadline. Newly-breached
 * reports are flagged and auto-escalated so they surface at the top of
 * the triage queue and no urgent report silently ages out of view.
 */
export async function runSlaMonitor(): Promise<{ checked: number; newlyBreached: number }> {
  const pastDue = await reportsRepository.findOpenReportsPastDue();
  let newlyBreached = 0;

  for (const report of pastDue) {
    const now = new Date();
    const responseBreached = !report.sla_response_breached && new Date(report.sla_response_due_at!) < now;
    const resolutionBreached = !report.sla_resolution_breached && new Date(report.sla_resolution_due_at!) < now;

    if (!responseBreached && !resolutionBreached) continue;

    const updateFields: Parameters<typeof reportsRepository.updateStatus>[1] = {};
    if (responseBreached) updateFields.sla_response_breached = true;
    if (resolutionBreached) updateFields.sla_resolution_breached = true;

    // Auto-escalate reports still awaiting their first response once
    // that SLA is breached, so a triage officer sees it immediately.
    const shouldAutoEscalate = responseBreached && ["submitted", "triaged", "assigned"].includes(report.status);
    if (shouldAutoEscalate) updateFields.status = "escalated";

    const updated = await reportsRepository.updateStatus(report.id, updateFields);
    newlyBreached++;

    await triageActionsRepository.create({
      report_id: report.id,
      actor_id: null,
      action_type: shouldAutoEscalate ? "escalate" : "comment",
      previous_status: report.status,
      new_status: updated.status,
      notes: `SLA monitor: ${responseBreached ? "response SLA breached. " : ""}${
        resolutionBreached ? "resolution SLA breached. " : ""
      }${shouldAutoEscalate ? "Auto-escalated." : ""}`.trim(),
    });

    if (shouldAutoEscalate) {
      notificationsService.notifyReporter(updated, "status_escalated").catch((err) => {
        logger.error({ err, reportId: report.id }, "Failed to send SLA-breach escalation notification");
      });
    }
  }

  logger.info({ checked: pastDue.length, newlyBreached }, "SLA monitor run complete");
  return { checked: pastDue.length, newlyBreached };
}
