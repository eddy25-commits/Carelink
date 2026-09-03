import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { LoadingBlock, EmptyState, ErrorAlert } from "../components/Feedback";
import { triageApi } from "../api/triage";
import { ApiError } from "../api/client";
import { formatRelativeDue, formatDateTime } from "../utils/formatters";
import { CATEGORY_LABELS } from "../utils/constants";
import { useLanguage } from "../i18n/LanguageContext";

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

export default function TriageDashboard() {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await triageApi.queue({
        priorityLevel: priorityFilter || undefined,
        unassignedOnly: unassignedOnly || undefined,
      });
      setReports(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("triageDashboard.errorLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [priorityFilter, unassignedOnly, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the queue current without a manual refresh, but pause while the
  // tab is hidden so we are not burning battery or data in the background,
  // an important consideration for the low resource settings this is built for.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const counts = useMemo(() => {
    const base = { critical: 0, high: 0, medium: 0, low: 0 };
    reports.forEach((r) => {
      if (base[r.priority_level] !== undefined) base[r.priority_level]++;
    });
    return base;
  }, [reports]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>{t("triageDashboard.heading")}</h1>
          <p>{t("triageDashboard.subheading")}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          {t("triageDashboard.refreshButton")}
        </button>
      </div>

      {lastUpdated && (
        <p style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", color: "#94a3c2", fontSize: "0.8rem" }}>
          {t("triageDashboard.updatedLabel", {
            time: lastUpdated.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
          })}
        </p>
      )}

      <div className="page-shell" style={{ padding: 0 }}>
        {/* Signature element: live priority pulse */}
        <div className="pulse-bar">
          {PRIORITY_ORDER.map((level) => (
            <button
              key={level}
              className={`pulse-pill pulse-${level} ${priorityFilter === level ? "pulse-active" : ""}`}
              onClick={() => setPriorityFilter(priorityFilter === level ? "" : level)}
            >
              <span className="pulse-count">{counts[level]}</span>
              <span className="pulse-label">{level}</span>
              {level === "critical" && counts.critical > 0 && <span className="pulse-ring" aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "22px 0" }}>
          <label className="checkbox-row" style={{ fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={unassignedOnly}
              onChange={(e) => setUnassignedOnly(e.target.checked)}
            />
            {t("triageDashboard.unassignedOnly")}
          </label>
          {priorityFilter && (
            <button className="btn btn-ghost btn-sm" onClick={() => setPriorityFilter("")}>
              {t("triageDashboard.clearFilter")}
            </button>
          )}
        </div>

        {isLoading && <LoadingBlock label={t("triageDashboard.loadingQueue")} />}
        <ErrorAlert message={error} />

        {!isLoading && !error && reports.length === 0 && (
          <GlassCard>
            <EmptyState
              icon="✓"
              title={t("triageDashboard.emptyTitle")}
              description={t("triageDashboard.emptyDescription")}
            />
          </GlassCard>
        )}

        <div className="stack" style={{ gap: 14 }}>
          {reports.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportRow({ report }) {
  const { t } = useLanguage();
  const dueLabel = formatRelativeDue(report.sla_response_due_at || report.sla_resolution_due_at);
  const isOverdue = dueLabel.startsWith("Overdue");

  return (
    <Link to={`/reports/${report.id}`} style={{ textDecoration: "none" }}>
      <GlassCard tight className="report-row">
        <div className="report-row-main">
          <div className="report-row-top">
            <PriorityBadge priority={report.priority_level} />
            <StatusBadge status={report.status} />
            <span className="report-row-category">{CATEGORY_LABELS[report.category] || report.category}</span>
          </div>
          <p className="report-row-description">{report.description}</p>
          <span className="report-row-meta">{t("triageDashboard.reportedLabel", { time: formatDateTime(report.created_at) })}</span>
        </div>
        <div className={`report-row-due ${isOverdue ? "due-overdue" : ""}`}>{dueLabel}</div>
      </GlassCard>
    </Link>
  );
}
