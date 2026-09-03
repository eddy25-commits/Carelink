import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { LoadingBlock, ErrorAlert, SuccessAlert } from "../components/Feedback";
import { reportsApi } from "../api/reports";
import { triageApi } from "../api/triage";
import { healthWorkersApi } from "../api/healthWorkers";
import { ApiError } from "../api/client";
import { formatDateTime, formatRelativeDue } from "../utils/formatters";
import { CATEGORY_LABELS } from "../utils/constants";
import ReportAttachments from "../components/ReportAttachments";
import { useLanguage } from "../i18n/LanguageContext";

const ACTIONS_BY_STATUS = {
  submitted: ["triage", "assign", "escalate"],
  triaged: ["assign", "escalate"],
  assigned: ["escalate", "resolve", "reassign"],
  in_progress: ["escalate", "resolve"],
  escalated: ["assign", "resolve"],
  resolved: ["close", "reopen"],
  closed: ["reopen"],
};

export default function ReportDetail() {
  const { t } = useLanguage();
  const ACTION_LABELS = {
    triage: t("reportDetail.actionTriage"),
    assign: t("reportDetail.actionAssign"),
    reassign: t("reportDetail.actionReassign"),
    escalate: t("reportDetail.actionEscalate"),
    resolve: t("reportDetail.actionResolve"),
    close: t("reportDetail.actionClose"),
    reopen: t("reportDetail.actionReopen"),
  };
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [showAssignFor, setShowAssignFor] = useState(false);
  const [commentText, setCommentText] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [reportRes, historyRes, workersRes] = await Promise.all([
        reportsApi.getById(id),
        triageApi.history(id),
        healthWorkersApi.list(),
      ]);
      setReport(reportRes.data);
      setHistory(historyRes.data);
      setWorkers(workersRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("reportDetail.errorLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action) => {
    if ((action === "assign" || action === "reassign") && !selectedWorker) {
      setShowAssignFor(action);
      return;
    }

    setBusyAction(action);
    setError("");
    setSuccess("");
    try {
      if (action === "assign" || action === "reassign") {
        await triageApi.assign(id, selectedWorker, notes || undefined);
      } else {
        await triageApi[action](id, notes || undefined);
      }
      setSuccess(t("reportDetail.actionUpdated", { action: ACTION_LABELS[action].toLowerCase() }));
      setNotes("");
      setShowAssignFor(false);
      setSelectedWorker("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("reportDetail.errorAction"));
    } finally {
      setBusyAction("");
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setBusyAction("comment");
    setError("");
    try {
      await triageApi.comment(id, commentText.trim());
      setCommentText("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("reportDetail.errorNote"));
    } finally {
      setBusyAction("");
    }
  };

  if (isLoading) return <LoadingBlock label={t("reportDetail.loadingReport")} />;
  if (!report) return <div className="page-shell"><ErrorAlert message={error || t("reportDetail.errorNotFound")} /></div>;

  const availableActions = ACTIONS_BY_STATUS[report.status] || [];

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <Link to="/dashboard" className="navbar-link" style={{ padding: 0, marginBottom: 10, display: "inline-block" }}>
            {"\u2190"} {t("reportDetail.backLink")}
          </Link>
          <h1>{t("reportDetail.reportHeading", { token: report.report_token })}</h1>
        </div>
        <div className="detail-statuses">
          <PriorityBadge priority={report.priority_level} />
          <StatusBadge status={report.status} />
        </div>
      </div>

      <div className="form-layout">
        <div className="stack" style={{ gap: 20 }}>
          <GlassCard>
            <h3 style={{ marginBottom: 16 }}>{t("reportDetail.detailsHeading")}</h3>
            <p style={{ marginBottom: 20, color: "var(--navy-900)" }}>{report.description}</p>
            <div className="report-info-grid">
              <Info label={t("reportDetail.categoryLabel")} value={CATEGORY_LABELS[report.category] || report.category} />
              <Info label={t("reportDetail.peopleAffectedLabel")} value={report.affected_count} />
              <Info label={t("reportDetail.severityScoreLabel")} value={t("reportDetail.severityScoreValue", { score: report.severity_score })} />
              <Info label={t("reportDetail.reportedLabel")} value={formatDateTime(report.created_at)} />
              <Info label={t("reportDetail.responseDueLabel")} value={formatRelativeDue(report.sla_response_due_at)} />
              <Info label={t("reportDetail.resolutionDueLabel")} value={formatRelativeDue(report.sla_resolution_due_at)} />
              {report.address_text && <Info label={t("reportDetail.locationNoteLabel")} value={report.address_text} />}
              <Info
                label={t("reportDetail.reporterLabel")}
                value={report.is_anonymous ? t("reportDetail.anonymous") : report.reporter_contact || t("reportDetail.notProvided")}
              />
            </div>
            {report.symptoms?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p className="field-label" style={{ marginBottom: 10 }}>{t("reportDetail.symptomsLabel")}</p>
                <div className="chip-group">
                  {report.symptoms.map((symptom) => (
                    <span key={symptom} className="chip" style={{ cursor: "default" }}>
                      {symptom.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <ReportAttachments reportId={report.id} />
          </GlassCard>

          <GlassCard>
            <h3 style={{ marginBottom: 16 }}>{t("reportDetail.activityHeading")}</h3>
            <div className="stack" style={{ gap: 14 }}>
              {history.map((entry) => (
                <div key={entry.id} style={{ display: "flex", gap: 14 }}>
                  <div className="timeline-dot" aria-hidden="true" />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {entry.action_type.replace(/_/g, " ")}
                      {entry.new_status && entry.new_status !== entry.previous_status
                        ? `, now ${entry.new_status.replace(/_/g, " ")}`
                        : ""}
                    </p>
                    {entry.notes && <p style={{ color: "#5c6b85", fontSize: "0.86rem", marginTop: 2 }}>{entry.notes}</p>}
                    <p style={{ color: "#94a3c2", fontSize: "0.76rem", marginTop: 3 }}>{formatDateTime(entry.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="comment-form">
              <input
                type="text"
                className="input"
                placeholder={t("reportDetail.notePlaceholder")}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button variant="secondary" loading={busyAction === "comment"} onClick={submitComment}>
                {t("reportDetail.addNoteButton")}
              </Button>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="sticky-panel">
          <h3 style={{ marginBottom: 16 }}>{t("reportDetail.takeActionHeading")}</h3>

          <ErrorAlert message={error} />
          <SuccessAlert message={success} />

          {showAssignFor && (
            <div className="field">
              <label className="field-label" htmlFor="worker">
                {t("reportDetail.assignToLabel")}
              </label>
              <select id="worker" className="select" value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
                <option value="">{t("reportDetail.chooseWorker")}</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name} {w.district ? `(${w.district})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="notes">
              {t("reportDetail.notesLabel")}
            </label>
            <textarea
              id="notes"
              className="textarea"
              style={{ minHeight: 80 }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("reportDetail.notesPlaceholder")}
            />
          </div>

          <div className="stack" style={{ gap: 10 }}>
            {availableActions.map((action) => (
              <Button
                key={action}
                variant={action === "escalate" ? "danger" : action === "reopen" ? "secondary" : "primary"}
                block
                loading={busyAction === action}
                onClick={() => runAction(action)}
              >
                {ACTION_LABELS[action]}
              </Button>
            ))}
            {showAssignFor && (
              <Button
                variant="primary"
                block
                loading={busyAction === showAssignFor}
                onClick={() => runAction(showAssignFor)}
                disabled={!selectedWorker}
              >
                {t("reportDetail.confirmAssignment")}
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p style={{ color: "#7c8aa5", fontSize: "0.78rem", marginBottom: 3 }}>{label}</p>
      <p style={{ fontWeight: 600, textTransform: "capitalize" }}>{value}</p>
    </div>
  );
}
