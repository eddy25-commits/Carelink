import { useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import { ErrorAlert } from "../components/Feedback";
import { reportsApi } from "../api/reports";
import { ApiError } from "../api/client";
import { queueReport, isNetworkError } from "../utils/offlineQueue";
import { useLanguage } from "../i18n/LanguageContext";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  LANGUAGE_OPTIONS,
  SYMPTOM_OPTIONS,
  MAX_ATTACHMENTS_PER_REPORT,
  MAX_ATTACHMENT_SIZE_MB,
  ALLOWED_ATTACHMENT_TYPES,
} from "../utils/constants";

const CATEGORIES = Object.keys(CATEGORY_LABELS);

const initialForm = {
  category: "individual_symptom",
  description: "",
  symptoms: [],
  affectedCount: 1,
  addressText: "",
  isAnonymous: false,
  reporterContact: "",
  reporterLanguage: "en",
};

export default function ReportForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedReport, setSubmittedReport] = useState(null);
  const [wasQueued, setWasQueued] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [attachmentStatus, setAttachmentStatus] = useState("idle"); // idle | uploading | uploaded | failed

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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

  const toggleSymptom = (value) => {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(value)
        ? prev.symptoms.filter((s) => s !== value)
        : [...prev.symptoms, value],
    }));
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus("captured");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.description.trim().length < 5) {
      setError(t("reportForm.errorShort"));
      return;
    }

    setIsSubmitting(true);
    const payload = {
      isAnonymous: form.isAnonymous,
      reporterLanguage: form.reporterLanguage,
      category: form.category,
      description: form.description.trim(),
      symptoms: form.symptoms,
      affectedCount: Number(form.affectedCount) || 1,
      addressText: form.addressText.trim() || undefined,
      location: location || undefined,
    };
    if (!form.isAnonymous && form.reporterContact.trim()) {
      payload.reporterContact = form.reporterContact.trim();
    }

    try {
      const res = await reportsApi.submit(payload);
      setSubmittedReport(res.data);

      if (attachmentFiles.length > 0) {
        setAttachmentStatus("uploading");
        try {
          await reportsApi.uploadAttachments(res.data.id, attachmentFiles);
          setAttachmentStatus("uploaded");
        } catch {
          // The report itself is safely submitted either way — only the photos failed to attach.
          setAttachmentStatus("failed");
        }
      }
    } catch (err) {
      if (isNetworkError(err)) {
        // No connection right now — save locally and send automatically once back online.
        // (Attachments can't be queued offline; the reporter can add them later via
        // "Track your report" once the report has synced.)
        queueReport(payload);
        setWasQueued(true);
        setSubmittedReport({ report_token: null, queued: true });
      } else {
        setError(err instanceof ApiError ? err.message : t("reportForm.errorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedReport) {
    return (
      <div className="page-shell" style={{ maxWidth: 620, margin: "0 auto" }}>
        <GlassCard style={{ marginTop: 48, textAlign: "center" }}>
          <div className="option-icon" style={{ margin: "0 auto 18px" }} aria-hidden="true">
            {wasQueued ? "\u21BB" : "\u2713"}
          </div>
          {wasQueued ? (
            <>
              <h2 style={{ marginBottom: 10 }}>{t("reportForm.queuedHeading")}</h2>
              <p style={{ color: "#5c6b85", marginBottom: 26 }}>
                {t("reportForm.queuedBody")}
                {attachmentFiles.length > 0 && t("reportForm.queuedAttachmentsWarning")}
              </p>
            </>
          ) : (
            <>
              <h2 style={{ marginBottom: 10 }}>{t("reportForm.successHeading")}</h2>
              <p style={{ color: "#5c6b85", marginBottom: 26 }}>
                {t("reportForm.successBody")}
                {attachmentStatus === "uploading" && t("reportForm.uploadingPhotos")}
                {attachmentStatus === "uploaded" && t("reportForm.photosAttached")}
                {attachmentStatus === "failed" && t("reportForm.photosFailed")}
              </p>
            </>
          )}
          {!wasQueued && (
            <div
              className="glass"
              style={{
                padding: "18px 24px",
                fontFamily: "var(--font-display)",
                fontSize: "1.6rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "var(--blue-700)",
                marginBottom: 26,
              }}
            >
              {submittedReport.report_token}
            </div>
          )}
          <div className="hero-actions">
            {!wasQueued && (
              <Link to={`/track?token=${submittedReport.report_token}`} className="btn btn-primary">
                {t("reportForm.trackButton")}
              </Link>
            )}
            <Link to="/" className="btn btn-secondary">
              {t("reportForm.homeButton")}
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>{t("reportForm.heading")}</h1>
          <p>{t("reportForm.subheading")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-layout">
        <GlassCard>
          <div className="field">
            <span className="field-label">{t("reportForm.categoryQuestion")}</span>
            <div className="chip-group">
              {CATEGORIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`chip ${form.category === value ? "active" : ""}`}
                  onClick={() => update("category", value)}
                >
                  {CATEGORY_LABELS[value]}
                </button>
              ))}
            </div>
            <span className="field-hint">{CATEGORY_DESCRIPTIONS[form.category]}</span>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="description">
              {t("reportForm.descriptionLabel")}
            </label>
            <textarea
              id="description"
              className="textarea"
              placeholder={t("reportForm.descriptionPlaceholder")}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <span className="field-label">{t("reportForm.symptomsLabel")}</span>
            <div className="chip-group">
              {SYMPTOM_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`chip ${form.symptoms.includes(option.value) ? "active" : ""}`}
                  onClick={() => toggleSymptom(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label className="field-label" htmlFor="affectedCount">
                {t("reportForm.affectedCountLabel")}
              </label>
              <input
                id="affectedCount"
                type="number"
                min="1"
                className="input"
                value={form.affectedCount}
                onChange={(e) => update("affectedCount", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="reporterLanguage">
                {t("reportForm.languageLabel")}
              </label>
              <select
                id="reporterLanguage"
                className="select"
                value={form.reporterLanguage}
                onChange={(e) => update("reporterLanguage", e.target.value)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="addressText">
              {t("reportForm.addressLabel")}
            </label>
            <input
              id="addressText"
              type="text"
              className="input"
              placeholder={t("reportForm.addressPlaceholder")}
              value={form.addressText}
              onChange={(e) => update("addressText", e.target.value)}
            />
            <div style={{ marginTop: 10 }}>
              <Button type="button" variant="secondary" size="sm" onClick={captureLocation}>
                {locationStatus === "locating" ? t("reportForm.locating") : t("reportForm.shareLocation")}
              </Button>
              {locationStatus === "captured" && (
                <span className="field-hint" style={{ marginLeft: 10, color: "#1f7a4d" }}>
                  {t("reportForm.locationCaptured")}
                </span>
              )}
              {locationStatus === "denied" && (
                <span className="field-hint" style={{ marginLeft: 10 }}>
                  {t("reportForm.locationDenied")}
                </span>
              )}
            </div>
          </div>

          <div className="field">
            <span className="field-label">{t("reportForm.attachmentsLabel")}</span>
            <span className="field-hint" style={{ display: "block", marginBottom: 10 }}>
              {t("reportForm.attachmentsHint", { max: MAX_ATTACHMENTS_PER_REPORT, size: MAX_ATTACHMENT_SIZE_MB })}
            </span>
            <input
              type="file"
              className="input"
              accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
              multiple
              onChange={handleFilesSelected}
            />
            {attachmentFiles.length > 0 && (
              <span className="field-hint" style={{ marginTop: 6, display: "block" }}>
                {t("reportForm.attachmentsSelected", { count: attachmentFiles.length })}
              </span>
            )}
            <ErrorAlert message={attachmentError} />
          </div>
        </GlassCard>

        <GlassCard className="sticky-panel">
          <h3 style={{ marginBottom: 6 }}>{t("reportForm.contactHeading")}</h3>
          <p style={{ color: "#5c6b85", fontSize: "0.88rem", marginBottom: 18 }}>
            {t("reportForm.contactSubheading")}
          </p>

          <div className="checkbox-row" style={{ marginBottom: 18 }}>
            <input
              id="isAnonymous"
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => update("isAnonymous", e.target.checked)}
            />
            <label htmlFor="isAnonymous" style={{ fontSize: "0.92rem" }}>
              {t("reportForm.anonymousLabel")}
            </label>
          </div>

          {!form.isAnonymous && (
            <div className="field">
              <label className="field-label" htmlFor="reporterContact">
                {t("reportForm.contactLabel")}
              </label>
              <input
                id="reporterContact"
                type="text"
                className="input"
                placeholder={t("reportForm.contactPlaceholder")}
                value={form.reporterContact}
                onChange={(e) => update("reporterContact", e.target.value)}
              />
            </div>
          )}

          <ErrorAlert message={error} />

          <Button type="submit" block loading={isSubmitting} style={{ marginTop: 8 }}>
            {t("reportForm.submitButton")}
          </Button>

          <p style={{ fontSize: "0.78rem", color: "#7c8aa5", marginTop: 14, textAlign: "center" }}>
            {t("reportForm.referenceHint")}
          </p>
        </GlassCard>
      </form>
    </div>
  );
}
