import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { LoadingBlock, ErrorAlert, SuccessAlert } from "../components/Feedback";
import { incidentsApi } from "../api/incidents";
import { ApiError } from "../api/client";
import { formatDateTime } from "../utils/formatters";
import { CATEGORY_LABELS } from "../utils/constants";
import { useLanguage } from "../i18n/LanguageContext";

const STATUS_TRANSITIONS = ["active", "monitoring", "resolved"];

export default function IncidentDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await incidentsApi.getById(id);
      setIncident(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("incidentDetail.errorLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (status) => {
    setBusy(true);
    setSuccess("");
    setError("");
    try {
      await incidentsApi.updateStatus(id, status);
      setSuccess(t("incidentDetail.statusUpdated", { status }));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("incidentDetail.errorUpdate"));
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <LoadingBlock label={t("incidentDetail.loadingIncident")} />;
  if (!incident) return <div className="page-shell"><ErrorAlert message={error || t("incidentDetail.errorNotFound")} /></div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <Link to="/incidents" className="navbar-link" style={{ padding: 0, marginBottom: 10, display: "inline-block" }}>
            {"\u2190"} {t("incidentDetail.backLink")}
          </Link>
          <h1>{incident.name}</h1>
        </div>
        <div className="detail-statuses">
          <PriorityBadge priority={incident.severity_level} />
          <span className="badge badge-neutral">
            <span className="badge-dot" />
            {incident.status}
          </span>
        </div>
      </div>

      <div className="form-layout">
        <GlassCard>
          <h3 style={{ marginBottom: 16 }}>{t("incidentDetail.linkedReportsHeading", { count: incident.reports?.length || 0 })}</h3>
          <div className="stack" style={{ gap: 12 }}>
            {(incident.reports || []).map((report) => (
              <Link key={report.id} to={`/reports/${report.id}`} style={{ textDecoration: "none" }}>
                <div className="glass incident-report-row">
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{CATEGORY_LABELS[report.category] || report.category}</p>
                    <p style={{ fontSize: "0.84rem", color: "#5c6b85" }}>{formatDateTime(report.created_at)}</p>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="sticky-panel">
          <h3 style={{ marginBottom: 16 }}>{t("incidentDetail.statusHeading")}</h3>
          <ErrorAlert message={error} />
          <SuccessAlert message={success} />
          <div className="stack" style={{ gap: 10 }}>
            {STATUS_TRANSITIONS.filter((s) => s !== incident.status).map((s) => (
              <Button key={s} variant="secondary" block loading={busy} onClick={() => updateStatus(s)}>
                {t("incidentDetail.markAsButton", { status: s })}
              </Button>
            ))}
          </div>

          <div style={{ marginTop: 22, fontSize: "0.85rem", color: "#5c6b85" }}>
            <p style={{ marginBottom: 6 }}>{t("incidentDetail.firstReport", { time: formatDateTime(incident.first_report_at) })}</p>
            <p>{t("incidentDetail.lastActivity", { time: formatDateTime(incident.last_report_at) })}</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
