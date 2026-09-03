import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import { ErrorAlert, SuccessAlert } from "../components/Feedback";
import { reportsApi } from "../api/reports";
import { ApiError } from "../api/client";
import { formatDateTime } from "../utils/formatters";
import { useLanguage } from "../i18n/LanguageContext";
import {
  CATEGORY_LABELS,
  MAX_ATTACHMENTS_PER_REPORT,
  MAX_ATTACHMENT_SIZE_MB,
  ALLOWED_ATTACHMENT_TYPES,
} from "../utils/constants";

export default function TrackStatus() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [attachmentStatus, setAttachmentStatus] = useState("idle"); // idle | uploading | uploaded | failed

  const lookup = async (value) => {
    if (!value || value.trim().length < 4) {
      setError(t("trackStatus.errorEmpty"));
      return;
    }
    setError("");
    setIsLoading(true);
    setReport(null);
    setAttachmentFiles([]);
    setAttachmentError("");
    setAttachmentStatus("idle");
    try {
      const res = await reportsApi.getByToken(value.trim().toUpperCase());
      setReport(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("trackStatus.errorNotFound"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesSelected = (event) => {
    const picked = Array.from(event.target.files || []);
    setAttachmentError("");
    if (picked.length > MAX_ATTACHMENTS_PER_REPORT) {
      setAttachmentError(t("attachments.tooMany", { max: MAX_ATTACHMENTS_PER_REPORT }));
      return;
    }
    const tooBig = picked.find((f) => f.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setAttachmentError(t("attachments.tooBig", { size: MAX_ATTACHMENT_SIZE_MB }));
      return;
    }
    const badType = picked.find((f) => !ALLOWED_ATTACHMENT_TYPES.includes(f.type));
    if (badType) {
      setAttachmentError(t("attachments.badType"));
      return;
    }
    setAttachmentFiles(picked);
  };

  const uploadAttachments = async () => {
    if (attachmentFiles.length === 0 || !report) return;
    setAttachmentStatus("uploading");
    try {
      await reportsApi.uploadAttachments(report.id, attachmentFiles);
      setAttachmentStatus("uploaded");
      setAttachmentFiles([]);
    } catch (err) {
      setAttachmentStatus("failed");
      setAttachmentError(err instanceof ApiError ? err.message : t("trackStatus.uploadFailed"));
    }
  };

  useEffect(() => {
    const initial = searchParams.get("token");
    if (initial) lookup(initial);
    // eslint disable next line react hooks exhaustive deps
    // Runs once on mount to honor a pre filled reference code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    lookup(token);
  };

  return (
    <div className="page-shell" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="page-header" style={{ padding: "44px 0 24px" }}>
        <div>
          <h1>{t("trackStatus.heading")}</h1>
          <p>{t("trackStatus.subheading")}</p>
        </div>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            className="input"
            style={{ flex: 1, minWidth: 200, textTransform: "uppercase" }}
            placeholder={t("trackStatus.placeholder")}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Button type="submit" loading={isLoading}>
            {t("trackStatus.checkButton")}
          </Button>
        </form>
        <ErrorAlert message={error} />
      </GlassCard>

      {report && (
        <GlassCard style={{ marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "0.8rem", color: "#7c8aa5", marginBottom: 4 }}>{t("trackStatus.referenceCode")}</p>
              <h3 style={{ fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}>{report.report_token}</h3>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority_level} />
            </div>
          </div>

          <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
            <DetailRow label={t("trackStatus.category")} value={CATEGORY_LABELS[report.category] || report.category} />
            <DetailRow label={t("trackStatus.reported")} value={formatDateTime(report.created_at)} />
            {report.triaged_at && <DetailRow label={t("trackStatus.reviewed")} value={formatDateTime(report.triaged_at)} />}
            {report.resolved_at && <DetailRow label={t("trackStatus.resolved")} value={formatDateTime(report.resolved_at)} />}
          </div>

          <div className="alert alert-info" style={{ marginTop: 22 }}>
            <span aria-hidden="true">{"\u2139"}</span>
            <span>
              {report.status === "resolved" || report.status === "closed"
                ? t("trackStatus.infoResolved")
                : t("trackStatus.infoActive")}
            </span>
          </div>

          <div style={{ marginTop: 22 }}>
            <p className="field-label" style={{ marginBottom: 6 }}>
              {t("trackStatus.addPhotoLabel")}
            </p>
            <p className="field-hint" style={{ marginBottom: 10 }}>
              {t("trackStatus.addPhotoHint", { max: MAX_ATTACHMENTS_PER_REPORT, size: MAX_ATTACHMENT_SIZE_MB })}
            </p>
            <input
              type="file"
              className="input"
              accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
              multiple
              onChange={handleFilesSelected}
            />
            <ErrorAlert message={attachmentError} />
            {attachmentStatus === "uploaded" && <SuccessAlert message={t("trackStatus.uploaded")} />}
            {attachmentFiles.length > 0 && attachmentStatus !== "uploaded" && (
              <Button
                type="button"
                size="sm"
                loading={attachmentStatus === "uploading"}
                onClick={uploadAttachments}
                style={{ marginTop: 10 }}
              >
                {t("trackStatus.uploadButton")} ({attachmentFiles.length})
              </Button>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="status-detail-row">
      <span style={{ color: "#7c8aa5" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
