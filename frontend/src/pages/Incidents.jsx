import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import { PriorityBadge } from "../components/Badge";
import { LoadingBlock, EmptyState, ErrorAlert, SuccessAlert } from "../components/Feedback";
import { incidentsApi } from "../api/incidents";
import { ApiError } from "../api/client";
import { formatDateTime } from "../utils/formatters";
import { useLanguage } from "../i18n/LanguageContext";

export default function Incidents() {
  const { t } = useLanguage();
  const STATUS_OPTIONS = [
    { value: "", label: t("incidents.statusAll") },
    { value: "active", label: t("incidents.statusActive") },
    { value: "monitoring", label: t("incidents.statusMonitoring") },
    { value: "resolved", label: t("incidents.statusResolved") },
  ];
  const [incidents, setIncidents] = useState([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await incidentsApi.list(status ? { status } : undefined);
      setIncidents(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("incidents.errorLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [status, t]);

  useEffect(() => {
    load();
  }, [load]);

  const runClustering = async () => {
    setIsRunning(true);
    setSuccess("");
    setError("");
    try {
      const res = await incidentsApi.runClusteringNow();
      setSuccess(
        t("incidents.scanSuccess", { clusters: res.data.clustersFound, created: res.data.incidentsCreated })
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("incidents.errorScan"));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>{t("incidents.heading")}</h1>
          <p>{t("incidents.subheading")}</p>
        </div>
        <Button variant="secondary" loading={isRunning} onClick={runClustering}>
          {t("incidents.scanButton")}
        </Button>
      </div>

      <div className="page-shell" style={{ padding: 0 }}>
        <div className="chip-group" style={{ marginBottom: 20 }}>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`chip ${status === option.value ? "active" : ""}`}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <SuccessAlert message={success} />
        <ErrorAlert message={error} />

        {isLoading && <LoadingBlock label={t("incidents.loadingIncidents")} />}

        {!isLoading && incidents.length === 0 && (
          <GlassCard>
            <EmptyState
              icon="◎"
              title={t("incidents.emptyTitle")}
              description={t("incidents.emptyDescription")}
            />
          </GlassCard>
        )}

        <div className="stack" style={{ gap: 14 }}>
          {incidents.map((incident) => (
            <Link key={incident.id} to={`/incidents/${incident.id}`} style={{ textDecoration: "none" }}>
              <GlassCard tight className="report-row">
                <div className="report-row-main">
                  <div className="report-row-top">
                    <PriorityBadge priority={incident.severity_level} />
                    <span className="badge badge-neutral">
                      <span className="badge-dot" />
                      {incident.status}
                    </span>
                  </div>
                  <p className="report-row-description">{incident.name}</p>
                  <span className="report-row-meta">
                    {t("incidents.linkedReports", { count: incident.report_count, time: formatDateTime(incident.last_report_at) })}
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
