import { reportsRepository } from "../reports/reports.repository";
import { triageActionsRepository } from "./triage-actions.repository";
import { notificationsService } from "../notifications/notifications.service";
import { ConflictError, NotFoundError } from "../../utils/errors";
import { Report, ReportStatus, TriageActionType } from "../../types/domain";
import { TemplateName } from "../notifications/notification-templates";
import { logger } from "../../config/logger";
import { TriageQueueQuery } from "../reports/reports.validation";

// Defines which statuses a report may legally transition FROM for each
// action, keeping the workflow enforceable rather than implicit.
const ALLOWED_TRANSITIONS: Record<TriageActionType, ReportStatus[]> = {
  triage: ["submitted"],
  assign: ["submitted", "triaged"],
  reassign: ["assigned", "in_progress", "escalated"],
  escalate: ["submitted", "triaged", "assigned", "in_progress"],
  resolve: ["assigned", "in_progress", "escalated"],
  close: ["resolved"],
  reopen: ["closed", "resolved"],
  comment: ["submitted", "triaged", "assigned", "in_progress", "escalated", "resolved", "closed"],
};

const RESULTING_STATUS: Partial<Record<TriageActionType, ReportStatus>> = {
  triage: "triaged",
  assign: "assigned",
  reassign: "assigned",
  escalate: "escalated",
  resolve: "resolved",
  close: "closed",
  reopen: "in_progress",
};

const NOTIFICATION_TEMPLATE: Partial<Record<TriageActionType, TemplateName>> = {
  triage: "status_triaged",
  assign: "status_assigned",
  reassign: "status_assigned",
  escalate: "status_escalated",
  resolve: "status_resolved",
  close: "status_closed",
};

async function loadReportOrThrow(reportId: string): Promise<Report> {
  const report = await reportsRepository.findById(reportId);
  if (!report) throw new NotFoundError("Report");
  return report;
}

function assertTransitionAllowed(action: TriageActionType, report: Report): void {
  const allowedFrom = ALLOWED_TRANSITIONS[action];
  if (!allowedFrom.includes(report.status)) {
    throw new ConflictError(
      `Cannot perform "${action}" on a report in status "${report.status}". Allowed from: ${allowedFrom.join(", ")}`
    );
  }
}

interface TransitionOptions {
  actorId: string;
  notes?: string;
  assigneeId?: string; // required for assign/reassign
}

async function applyTransition(
  reportId: string,
  action: TriageActionType,
  options: TransitionOptions
): Promise<Report> {
  const report = await loadReportOrThrow(reportId);
  assertTransitionAllowed(action, report);

  const newStatus = RESULTING_STATUS[action];
  const updateFields: Parameters<typeof reportsRepository.updateStatus>[1] = {};

  if (newStatus) updateFields.status = newStatus;
  if (action === "triage") updateFields.triaged_at = new Date();
  if (action === "resolve") updateFields.resolved_at = new Date();
  if (action === "assign" || action === "reassign") {
    if (!options.assigneeId) {
      throw new ConflictError(`"${action}" requires an assigneeId`);
    }
    updateFields.assigned_to = options.assigneeId;
  }
  if (action === "reopen") {
    updateFields.assigned_to = report.assigned_to; // preserved, worker resumes ownership
    updateFields.resolved_at = null; // clear resolution timestamp on reopen
  }

  const updated = Object.keys(updateFields).length > 0 ? await reportsRepository.updateStatus(reportId, updateFields) : report;

  await triageActionsRepository.create({
    report_id: reportId,
    actor_id: options.actorId,
    action_type: action,
    previous_status: report.status,
    new_status: updated.status,
    notes: options.notes ?? null,
  });

  const template = NOTIFICATION_TEMPLATE[action];
  if (template) {
    notificationsService.notifyReporter(updated, template).catch((err) => {
      logger.error({ err, reportId, action }, "Failed to send status-change notification");
    });
  }

  return updated;
}

export const triageService = {
  async triage(reportId: string, actorId: string, notes?: string): Promise<Report> {
    return applyTransition(reportId, "triage", { actorId, notes });
  },

  async assign(reportId: string, actorId: string, assigneeId: string, notes?: string): Promise<Report> {
    const report = await loadReportOrThrow(reportId);
    const action: TriageActionType = report.assigned_to ? "reassign" : "assign";
    return applyTransition(reportId, action, { actorId, assigneeId, notes });
  },

  async escalate(reportId: string, actorId: string, notes?: string): Promise<Report> {
    return applyTransition(reportId, "escalate", { actorId, notes });
  },

  async resolve(reportId: string, actorId: string, notes?: string): Promise<Report> {
    return applyTransition(reportId, "resolve", { actorId, notes });
  },

  async close(reportId: string, actorId: string, notes?: string): Promise<Report> {
    return applyTransition(reportId, "close", { actorId, notes });
  },

  async reopen(reportId: string, actorId: string, notes?: string): Promise<Report> {
    return applyTransition(reportId, "reopen", { actorId, notes });
  },

  async comment(reportId: string, actorId: string, notes: string): Promise<Report> {
    const report = await loadReportOrThrow(reportId);
    await triageActionsRepository.create({
      report_id: reportId,
      actor_id: actorId,
      action_type: "comment",
      previous_status: report.status,
      new_status: report.status,
      notes,
    });
    return report;
  },

  async history(reportId: string) {
    await loadReportOrThrow(reportId);
    return triageActionsRepository.findByReport(reportId);
  },

  async queue(query: TriageQueueQuery) {
    return reportsRepository.triageQueue(query);
  },
};
