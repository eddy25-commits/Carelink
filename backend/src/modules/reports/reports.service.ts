import { reportsRepository } from "./reports.repository";
import { triageActionsRepository } from "../triage/triage-actions.repository";
import { computeSeverity } from "../severity-scoring/severity-scoring.service";
import { slaService } from "../sla-policies/sla.service";
import { notificationsService } from "../notifications/notifications.service";
import { generateReportToken } from "../../utils/report-token";
import { NotFoundError } from "../../utils/errors";
import { CreateReportInput, ListReportsQuery } from "./reports.validation";
import { Report } from "../../types/domain";
import { logger } from "../../config/logger";

async function uniqueReportToken(): Promise<string> {
  // Extremely unlikely to collide (32^10 keyspace), but guard anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateReportToken();
    const existing = await reportsRepository.findByToken(token);
    if (!existing) return token;
  }
  throw new Error("Failed to generate a unique report token after 5 attempts");
}

export const reportsService = {
  /**
   * Submits a new community health report: scores severity, computes
   * SLA due dates from the resulting priority, persists the report,
   * records the initial audit action, and (non-blocking) notifies the
   * reporter of receipt if they are not anonymous.
   */
  async submit(input: CreateReportInput): Promise<Report> {
    const severity = computeSeverity({
      category: input.category,
      symptoms: input.symptoms,
      description: input.description,
      affectedCount: input.affectedCount,
    });

    const sla = await slaService.computeDueDates(severity.priorityLevel);
    const reportToken = await uniqueReportToken();

    const report = await reportsRepository.create({
      report_token: reportToken,
      is_anonymous: input.isAnonymous,
      reporter_contact: input.isAnonymous ? null : input.reporterContact ?? null,
      reporter_language: input.reporterLanguage,
      category: input.category,
      description: input.description,
      symptoms: input.symptoms,
      affected_count: input.affectedCount,
      address_text: input.addressText ?? null,
      severity_score: severity.score,
      priority_level: severity.priorityLevel,
      status: "submitted",
      sla_response_due_at: sla.responseDueAt,
      sla_resolution_due_at: sla.resolutionDueAt,
      latitude: input.location?.latitude,
      longitude: input.location?.longitude,
    });

    await triageActionsRepository.create({
      report_id: report.id,
      actor_id: null,
      action_type: "triage",
      previous_status: null,
      new_status: "submitted",
      notes: `Auto-scored severity ${severity.score} (${severity.priorityLevel}). ${severity.reasons.join("; ")}`,
    });

    notificationsService.notifyReporter(report, "report_received").catch((err) => {
      logger.error({ err, reportId: report.id }, "Failed to send report_received notification");
    });

    return report;
  },

  async getById(id: string): Promise<Report> {
    const report = await reportsRepository.findById(id);
    if (!report) throw new NotFoundError("Report");
    return report;
  },

  /** Public, unauthenticated status lookup for community reporters. */
  async getByToken(reportToken: string): Promise<Report> {
    const report = await reportsRepository.findByToken(reportToken);
    if (!report) throw new NotFoundError("Report");
    return report;
  },

  async list(query: ListReportsQuery) {
    return reportsRepository.list(query);
  },
};
