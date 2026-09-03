import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { ErrorAlert, LoadingBlock } from "../components/Feedback";
import { healthWorkersApi } from "../api/healthWorkers";
import { reportsApi } from "../api/reports";
import { ApiError } from "../api/client";
import { CATEGORY_LABELS, STATUS_LABELS } from "../utils/constants";
import { formatDateTime } from "../utils/formatters";
import { useLanguage } from "../i18n/LanguageContext";

const PAGE_SIZE = 25;
const STATUSES = ["submitted", "triaged", "assigned", "in_progress", "escalated", "resolved", "closed"];

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [criticalCount, setCriticalCount] = useState(0);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: PAGE_SIZE });
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [reportsResponse, usersResponse, ...countResponses] = await Promise.all([
        reportsApi.list({ status: status || undefined, page, pageSize: PAGE_SIZE, sort: "newest" }),
        healthWorkersApi.list({ includeInactive: true }),
        ...STATUSES.map((value) => reportsApi.list({ status: value, page: 1, pageSize: 1 })),
        reportsApi.list({ priorityLevel: "critical", page: 1, pageSize: 1 }),
      ]);
      setReports(reportsResponse.data);
      setMeta(reportsResponse.meta);
      setUsers(usersResponse.data);
      setStatusCounts(Object.fromEntries(STATUSES.map((value, index) => [value, countResponses[index].meta.total])));
      setCriticalCount(countResponses[STATUSES.length].meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.error"));
    } finally {
      setIsLoading(false);
    }
  }, [page, status, t]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(meta.total / PAGE_SIZE));
  const openReports = STATUSES.filter((value) => !["resolved", "closed"].includes(value)).reduce(
    (total, value) => total + (statusCounts[value] || 0),
    0
  );

  return (
    <div className="page-shell admin-page">
      <div className="page-header">
        <div>
          <p className="admin-kicker">CareLink / Admin</p>
          <h1>{t("admin.heading")}</h1>
          <p>{t("admin.subheading")}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load} disabled={isLoading}>
          {t("admin.refreshButton")}
        </button>
      </div>

      <ErrorAlert message={error} />
      {isLoading ? <LoadingBlock label={t("admin.loading")} /> : (
        <>
          <section className="admin-stats" aria-label={t("admin.heading")}>
            <Stat label={t("admin.reports")} value={meta.total} accent="blue" />
            <Stat label={t("admin.users")} value={users.length} accent="green" />
            <Stat label={t("admin.openReports")} value={openReports} accent="amber" />
            <Stat label={t("admin.criticalReports")} value={criticalCount} accent="red" />
          </section>

          <div className="admin-grid">
            <section>
              <div className="admin-section-heading">
                <div>
                  <h2>{t("admin.reportsHeading")}</h2>
                  <span>{meta.total} total</span>
                </div>
                <select className="select admin-filter" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                  <option value="">{t("admin.allStatuses")}</option>
                  {STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
                </select>
              </div>
              <div className="admin-report-list">
                {reports.length === 0 && <GlassCard><p className="admin-empty">{t("admin.noReports")}</p></GlassCard>}
                {reports.map((report) => (
                  <Link key={report.id} to={`/reports/${report.id}`} className="admin-report-row">
                    <div>
                      <div className="admin-report-labels">
                        <PriorityBadge priority={report.priority_level} />
                        <StatusBadge status={report.status} />
                      </div>
                      <strong>{report.report_token}</strong>
                      <p>{CATEGORY_LABELS[report.category] || report.category} · {formatDateTime(report.created_at)}</p>
                    </div>
                    <span className="admin-report-arrow" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
              <div className="admin-pagination">
                <button className="btn btn-ghost btn-sm" onClick={() => setPage((value) => value - 1)} disabled={page <= 1}>{"←"}</button>
                <span>{t("admin.page", { page, pages: totalPages })}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage((value) => value + 1)} disabled={page >= totalPages}>{"→"}</button>
              </div>
            </section>

            <section>
              <div className="admin-section-heading"><div><h2>{t("admin.usersHeading")}</h2><span>{users.length} active</span></div></div>
              <GlassCard tight>
                <div className="admin-user-list">
                  {users.length === 0 && <p className="admin-empty">{t("admin.noUsers")}</p>}
                  {users.map((user) => (
                    <div className="admin-user-row" key={user.id}>
                      <span className="admin-user-avatar">{user.full_name?.slice(0, 1).toUpperCase()}</span>
                      <div><strong>{user.full_name}</strong><p>{user.email}</p></div>
                      <div className="admin-user-role"><span>{user.role?.replace(/_/g, " ")}</span><small>{user.district || ""}{user.is_active ? "" : " · inactive"}</small></div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return <GlassCard tight className={`admin-stat admin-stat-${accent}`}><span>{label}</span><strong>{value}</strong></GlassCard>;
}
